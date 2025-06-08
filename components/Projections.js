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

export default function Projections({ refresh }) {
  const [view, setView] = useState('daily');
  const [chartData, setChartData] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function run() {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data: acct } = await supabase
        .from('accounts')
        .select('current_balance')
        .eq('user_id', user.id)
        .single();
      if (!acct) return;

      const { data: paychecks } = await supabase
        .from('paychecks')
        .select('amount, schedule, next_date')
        .eq('user_id', user.id);

      const { data: ccs } = await supabase
        .from('credit_cards')
        .select('next_due_date, next_due_amount, avg_future_amount')
        .eq('user_id', user.id);

      const horizonEnd = addMonths(startOfDay(new Date()), 6);
      const events = [];

      paychecks.forEach(({ amount, schedule, next_date }) => {
        let dt = parseISO(next_date);
        while (!isBefore(horizonEnd, dt)) {
          events.push({ date: startOfDay(dt), amt: +amount });
          if (schedule === 'weekly') dt = addWeeks(dt, 1);
          else if (schedule === 'biweekly') dt = addWeeks(dt, 2);
          else if (schedule === 'bimonthly') dt = addDays(dt, 15);
          else dt = addMonths(dt, 1);
        }
      });

      ccs.forEach(({ next_due_date, next_due_amount, avg_future_amount }) => {
        let dt = parseISO(next_due_date);
        let first = true;
        while (!isBefore(horizonEnd, dt)) {
          events.push({
            date: startOfDay(dt),
            amt: -(first ? +next_due_amount : +avg_future_amount),
          });
          first = false;
          dt = addMonths(dt, 1);
        }
      });

      events.sort((a, b) => a.date - b.date);

      const daily = [];
      let bal = +acct.current_balance,
        sim = 0,
        minSim = 0;
      let minBal = bal,
        minDate = startOfDay(new Date()),
        negDay = null;
      let expSum = 0;

      events.forEach((e) => {
        if (e.amt < 0) expSum += -e.amt;
      });

      let idx = 0;
      for (
        let d = startOfDay(new Date());
        !isBefore(horizonEnd, d);
        d = addDays(d, 1)
      ) {
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

      const labels = [],
        dataBal = [],
        dataFlow = [],
        high = [],
        low = [],
        avg = [];

      if (view === 'daily') {
        daily.forEach((p) => {
          labels.push(format(p.date, 'MM/dd'));
          dataBal.push(p.bal);
          dataFlow.push(p.flow);
        });
      } else if (view === 'weekly') {
        let run = +acct.current_balance;
        for (
          let w = startOfDay(new Date());
          !isBefore(horizonEnd, w);
          w = addDays(w, 7)
        ) {
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

        let runSum = +acct.current_balance;
        for (
          let m = startOfMonth(new Date());
          !isBefore(horizonEnd, m);
          m = addMonths(m, 1)
        ) {
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

      const datasets = view === 'monthly'
        ? [
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
            },
          ]
        : [
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
            },
          ];

      setChartData({ labels, datasets });

      const finalBal = dataBal[dataBal.length - 1];
      const growth = (((finalBal / +acct.current_balance - 1) * 2 * 100) || 0).toFixed(2);
      const reqBal = Math.max(0, -minSim).toFixed(2);
      const biweeklyPayPeriods = Math.floor(26 / 2); // ~13 periods in 6 months
      const reqPay = biweeklyPayPeriods > 0 ? (minSim / biweeklyPayPeriods).toFixed(2) : '0.00';

      setStats({
        lowPoint: { date: minDate, balance: minBal },
        negDay,
        growth,
        requiredBalance: reqBal,
        requiredPay: reqPay,
      });
    }

    run();
  }, [refresh, view]);

  if (!chartData || !stats) {
    return <div className={styles.card}>Loading…</div>;
  }

  return (
    <>
      <div className={`${styles.card} ${styles.chartWide}`}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>6-Month Projection</h3>
          <div className={styles.btnGroup}>
            {['daily', 'weekly', 'monthly'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={view === v ? styles.active : ''}
              >
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
                y: {
                  position: 'left',
                  title: { display: true, text: 'Balance ($)' },
                },
                y1:
                  view === 'monthly'
                    ? {}
                    : {
                        position: 'right',
                        title: { display: true, text: 'Flow ($)' },
                        grid: { drawOnChartArea: false },
                      },
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
          <p className={styles.statValue}>${stats.requiredPay}</p>
        </div>
      </div>
    </>
  );
}
