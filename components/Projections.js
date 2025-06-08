// components/Projections.js
import React, { useEffect, useState } from 'react';
import styles from '../styles/Dashboard.module.css';
import { supabase } from '../lib/supabaseClient';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
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
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

export default function Projections({ refresh }) {
  const [view, setView] = useState('monthly');
  const [chartData, setChartData] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user.id;

      const { data: account } = await supabase
        .from('accounts')
        .select('current_balance')
        .eq('user_id', userId)
        .single();

      const { data: paychecks } = await supabase
        .from('paychecks')
        .select('amount, schedule, next_date')
        .eq('user_id', userId);

      const { data: creditCards } = await supabase
        .from('credit_cards')
        .select('next_due_date, next_due_amount, avg_future_amount')
        .eq('user_id', userId);

      const horizonEnd = addMonths(startOfDay(new Date()), 6);
      const events = [];

      paychecks?.forEach(({ amount, schedule, next_date }) => {
        let dt = parseISO(next_date);
        while (!isBefore(horizonEnd, dt)) {
          events.push({ date: startOfDay(dt), amt: +amount });
          if (schedule === 'weekly') dt = addWeeks(dt, 1);
          else if (schedule === 'biweekly') dt = addWeeks(dt, 2);
          else if (schedule === 'bimonthly') dt = addDays(dt, 15);
          else dt = addMonths(dt, 1);
        }
      });

      creditCards?.forEach(({ next_due_date, next_due_amount, avg_future_amount }) => {
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
      let bal = +account?.current_balance || 0;
      let sim = 0, minSim = 0, minBal = bal;
      let minDate = new Date(), negDay = null;
      let payCount = 0, expSum = 0;

      events.forEach((e) => {
        if (e.amt > 0) payCount++;
        else expSum += -e.amt;
      });

      let idx = 0;
      for (let d = startOfDay(new Date()); !isBefore(horizonEnd, d); d = addDays(d, 1)) {
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

      const labels = [], dataBal = [], dataFlow = [];
      if (view === 'monthly') {
        let runSum = +account?.current_balance || 0;
        for (let m = startOfMonth(new Date()); !isBefore(horizonEnd, m); m = addMonths(m, 1)) {
          const slice = daily.filter((p) => p.date >= m && p.date < addMonths(m, 1));
          const mf = slice.reduce((s, p) => s + p.flow, 0);
          runSum += mf;
          labels.push(format(m, 'MMM yy'));
          dataFlow.push(mf);
          dataBal.push(runSum);
        }
      }

      setChartData({
        labels,
        datasets: [
          {
            type: 'line',
            label: 'Balance',
            data: dataBal,
            borderColor: '#3b82f6',
            tension: 0.3,
            yAxisID: 'y',
            fill: false,
          },
          {
            type: 'bar',
            label: 'Flow',
            data: dataFlow,
            yAxisID: 'y1',
            backgroundColor: dataFlow.map((f) => (f >= 0 ? '#10b981' : '#ef4444')),
          },
        ],
      });

      const finalBal = dataBal[dataBal.length - 1];
      const growth = (((finalBal / (+account?.current_balance || 1) - 1) * 2 * 100) || 0).toFixed(2);
      const reqBal = Math.max(0, -minSim).toFixed(2);
      const reqPay = (reqBal / 6).toFixed(2);

      setStats({
        lowPoint: { date: minDate, balance: minBal },
        negDay,
        growth,
        requiredBalance: reqBal,
        requiredPay: reqPay,
      });
    }

    fetchData();
  }, [refresh, view]);

  return (
    <div className={styles.card}>
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

      {chartData ? (
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
                y1: {
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
      ) : (
        <div className={styles.loading}>Loading chart...</div>
      )}

      {stats && (
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
            <small>
              Required Starting Balance{' '}
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                (to remain positive)
              </span>
            </small>
            <p className={styles.statValue}>${stats.requiredBalance}</p>
          </div>
          <div className={styles.statCard}>
            <small>Required Paycheck</small>
            <p className={styles.statValue}>${stats.requiredPay}</p>
          </div>
        </div>
      )}
    </div>
  );
}
