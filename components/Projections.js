// components/Projections.js

import React, { useEffect, useState } from 'react';
import styles from '../styles/Dashboard.module.css';
import { supabase } from '../lib/supabaseClient';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarController,
  LineController,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  addDays,
  addWeeks,
  addMonths,
  parseISO,
  format,
  isBefore,
  startOfDay,
  startOfMonth,
  differenceInDays,
} from 'date-fns';

ChartJS.register(
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

export default function Projections({ refresh, scenarioId }) {
  const [view, setView] = useState('daily');
  const [chartData, setChartData] = useState(null);
  const [stats, setStats] = useState({
    lowPoint: { date: new Date(), balance: 0 },
    negDay: null,
    growth: '0.00',
    requiredBalance: '0.00',
    requiredPay: null,
  });

  useEffect(() => {
    async function run() {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Filter everything by scenario
      const accountQuery = supabase
        .from('accounts')
        .select('current_balance')
        .eq('user_id', user.id);

      if (scenarioId) accountQuery.eq('scenario_id', scenarioId);
      else accountQuery.is('scenario_id', null);

      const { data: acct } = await accountQuery.single();
      if (!acct) return;

      const paycheckQuery = supabase
        .from('paychecks')
        .select('amount, schedule, next_date')
        .eq('user_id', user.id);

      if (scenarioId) paycheckQuery.eq('scenario_id', scenarioId);
      else paycheckQuery.is('scenario_id', null);

      const { data: pcs } = await paycheckQuery;

      const ccQuery = supabase
        .from('credit_cards')
        .select('next_due_date, next_due_amount, avg_future_amount')
        .eq('user_id', user.id);

      if (scenarioId) ccQuery.eq('scenario_id', scenarioId);
      else ccQuery.is('scenario_id', null);

      const { data: ccs } = await ccQuery;

      // Everything else as before...
      const hasPaycheck = pcs && pcs.length > 0;
      const hasCreditCard = ccs && ccs.length > 0;

      const events = [];
      const today = startOfDay(new Date());
      const horizonEnd = addMonths(today, 6);

      pcs.forEach(({ amount, schedule, next_date }) => {
        let dt = parseISO(next_date);
        while (!isBefore(horizonEnd, dt)) {
          events.push({ date: startOfDay(dt), amt: +amount });
          if (schedule === 'weekly') dt = addWeeks(dt, 1);
          else if (schedule === 'biweekly') dt = addWeeks(dt, 2);
          else if (schedule === 'bimonthly') dt = addDays(dt, 15);
          else dt = addMonths(dt, 1);
        }
      });

      let totalCreditCardExpenses = 0;
      ccs.forEach(({ next_due_date, next_due_amount, avg_future_amount }) => {
        let dt = parseISO(next_due_date);
        let first = true;
        while (!isBefore(horizonEnd, dt)) {
          const amount = first ? +next_due_amount : +avg_future_amount;
          events.push({
            date: startOfDay(dt),
            amt: -amount,
          });
          totalCreditCardExpenses += amount;
          first = false;
          dt = addMonths(dt, 1);
        }
      });

      events.sort((a, b) => a.date - b.date);

      const daily = [];
      let bal = +acct.current_balance;
      let minBal = bal, minDate = today, negDay = null, sim = 0, minSim = 0;
      const startBal = bal;

      for (let d = today, idx = 0; !isBefore(horizonEnd, d); d = addDays(d, 1)) {
        let flow = 0;
        while (idx < events.length && events[idx].date.getTime() === d.getTime()) {
          flow += events[idx++].amt;
        }
        bal += flow;
        sim += flow;
        if (bal < minBal) {
          minBal = bal;
          minDate = d;
        }
        if (!negDay && bal < 0) negDay = format(d, 'MM/dd/yyyy');
        if (sim < minSim) minSim = sim;
        daily.push({ date: d, bal, flow });
      }

      const labels = [], dataBal = [], dataFlow = [], high = [], low = [], avg = [];

      if (view === 'daily') {
        daily.forEach((p) => {
          labels.push(format(p.date, 'MM/dd'));
          dataBal.push(p.bal);
          dataFlow.push(p.flow);
        });
      } else if (view === 'weekly') {
        let run = startBal;
        for (let w = today; !isBefore(horizonEnd, w); w = addDays(w, 7)) {
          const weekEnd = addDays(w, 6);
          const wf = events
            .filter((e) => e.date >= w && e.date <= weekEnd)
            .reduce((s, e) => s + e.amt, 0);
          run += wf;
          labels.push(format(w, 'MM/dd'));
          dataBal.push(run);
          dataFlow.push(wf);
        }
      } else {
        const flowByMonth = {};
        events.forEach((e) => {
          const key = format(startOfMonth(e.date), 'yyyy-MM');
          flowByMonth[key] = (flowByMonth[key] || 0) + e.amt;
        });

        let runSum = startBal;
        for (let m = startOfMonth(today); !isBefore(horizonEnd, m); m = addMonths(m, 1)) {
          const key = format(m, 'yyyy-MM');
          const mf = flowByMonth[key] || 0;
          runSum += mf;

          labels.push(format(m, 'MMM yy'));
          dataFlow.push(mf);
          dataBal.push(runSum);

          const slice = daily.filter((p) => p.date >= m && p.date < addMonths(m, 1));
          if (slice.length) {
            const bals = slice.map((p) => p.bal);
            high.push(Math.max(...bals));
            low.push(Math.min(...bals));
            avg.push(bals.reduce((a, b) => a + b, 0) / bals.length);
          } else {
            high.push(runSum);
            low.push(runSum);
            avg.push(runSum);
          }
        }
      }

      const datasets = [];
      if (view === 'monthly') {
        datasets.push(
          { type: 'line', label: 'Avg', data: avg, borderColor: '#3b82f6', fill: false },
          { type: 'line', label: 'High', data: high, borderColor: '#6366f1', fill: '+1' },
          { type: 'line', label: 'Low', data: low, borderColor: '#ef4444', fill: false },
          {
            type: 'bar',
            label: 'Flow',
            data: dataFlow,
            yAxisID: 'y1',
            backgroundColor: dataFlow.map((f) => (f >= 0 ? '#10b981' : '#ef4444')),
          },
          {
            type: 'line',
            label: 'Balance',
            data: dataBal,
            yAxisID: 'y',
            borderColor: '#3b82f6',
            fill: false,
          }
        );
      } else {
        datasets.push(
          {
            type: 'line',
            label: 'Balance',
            data: dataBal,
            yAxisID: 'y',
            borderColor: '#3b82f6',
            fill: false,
            tension: 0.1,
            pointRadius: view === 'daily' ? 0 : 3,
          },
          {
            type: 'bar',
            label: 'Flow',
            data: dataFlow,
            yAxisID: 'y1',
            backgroundColor: dataFlow.map((f) => (f >= 0 ? '#10b981' : '#ef4444')),
          }
        );
      }

      setChartData({ labels, datasets });

      const finalBal = dataBal[dataBal.length - 1];
      const growth = (((finalBal / startBal - 1) * 2 * 100) || 0).toFixed(2);
      const requiredBalance = Math.max(0, -minSim).toFixed(2);

      let requiredPay = null;
      if (hasPaycheck && hasCreditCard) {
        const firstPaycheck = pcs[0];
        const paycheckSchedule = firstPaycheck.schedule;
        let paycheckCount = 0;
        if (paycheckSchedule === 'weekly') {
          paycheckCount = Math.floor(differenceInDays(horizonEnd, today) / 7);
        } else if (paycheckSchedule === 'biweekly') {
          paycheckCount = Math.floor(differenceInDays(horizonEnd, today) / 14);
        } else if (paycheckSchedule === 'bimonthly') {
          paycheckCount = Math.floor(differenceInDays(horizonEnd, today) / 15);
        } else {
          paycheckCount = 6;
        }
        if (paycheckCount > 0) {
          const totalNeeded = totalCreditCardExpenses;
          requiredPay = (totalNeeded / paycheckCount).toFixed(2);
        }
      }

      setStats({
        lowPoint: { date: minDate, balance: minBal },
        negDay,
        growth,
        requiredBalance,
        requiredPay,
      });
    }

    run();
    // eslint-disable-next-line
  }, [refresh, view, scenarioId]);

  if (!chartData) return <div className={styles.card}>Loading…</div>;

  return (
    <>
      <div className={styles.chartWide}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>6-Month Projection</h3>
          <div className={styles.btnGroup}>
            {['daily', 'weekly', 'monthly'].map((v) => (
              <button key={v} onClick={() => setView(v)} className={view === v ? styles.active : ''}>
                {v[0].toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: '320px' }}>
          <Chart
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } },
                y: { position: 'left', title: { display: true, text: 'Balance ($)' } },
                y1: view === 'monthly'
                  ? {}
                  : { position: 'right', title: { display: true, text: 'Flow ($)' }, grid: { drawOnChartArea: false } },
              },
              plugins: {
                legend: { position: 'top' },
                tooltip: { mode: 'index', intersect: false },
              },
            }}
          />
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <small>Lowest Point</small>
          <p className={styles.statValue}>
            {format(stats.lowPoint.date, 'MM/dd/yyyy')} @ ${stats.lowPoint.balance.toFixed(2)}
          </p>
          {stats.negDay && <p className={styles.statWarn}>⚠️ Below zero on {stats.negDay}</p>}
        </div>
        <div className={styles.statCard}>
          <small>Annualized Growth</small>
          <p className={styles.statValue}>{stats.growth}%</p>
        </div>
        <div className={styles.statCard}>
          <small>Required Starting Balance</small>
          <p className={styles.statValue}>${stats.requiredBalance}</p>
        </div>
        <div className={styles.statCard}>
          <small>Required Paycheck</small>
          {stats.requiredPay !== null ? (
            <p className={styles.statValue}>${stats.requiredPay}</p>
          ) : (
            <p className={styles.statPlaceholder}>Add paycheck & credit card</p>
          )}
        </div>
      </div>
    </>
  );
}
