// components/Projections.js
import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Chart } from 'react-chartjs-2';
import { addDays, addWeeks, addMonths, isBefore } from 'date-fns';
import styles from '../styles/Dashboard.module.css';
import { supabase } from '../lib/supabaseClient';

// 1️⃣ Register Chart.js controllers + scales
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Projections({ refresh }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('weekly'); // default view
  const [chartData, setChartData] = useState(null);
  const [stats, setStats] = useState({
    lowPoint: { date: new Date(), balance: 0 },
    growth: '0.00',
    requiredBalance: '0.00',
    requiredPay: '0.00',
  });

  useEffect(() => {
    async function fetchAndBuild() {
      try {
        setLoading(true);
        setError(null);

        // ─── FETCH YOUR DATA ──────────────────────────────────────
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Account balance
        const { data: acct } = await supabase
          .from('accounts')
          .select('current_balance')
          .eq('user_id', user.id)
          .single();
        const currentBalance = acct?.current_balance || 0;

        // Paychecks
        const { data: paychecks } = await supabase
          .from('paychecks')
          .select('amount, schedule, next_date')
          .eq('user_id', user.id);

        // Credit cards
        const { data: cards } = await supabase
          .from('credit_cards')
          .select('next_due_date, next_due_amount, avg_future_amount')
          .eq('user_id', user.id);

        // ─── BUILD THE PROJECTION ─────────────────────────────────
        const start = new Date();
        const end = addMonths(start, 6);
        const tickFn =
          view === 'daily' ? addDays : view === 'weekly' ? addWeeks : addMonths;
        const unit = view === 'daily' ? 'day' : view === 'weekly' ? 'week' : 'month';

        let pointer = start;
        let balance = currentBalance;
        const points = [];

        while (isBefore(pointer, end) || +pointer === +end) {
          // 1. sum paychecks landing on this date
          const inflow = paychecks
            .filter((p) => new Date(p.next_date).toDateString() === pointer.toDateString())
            .reduce((sum, p) => sum + parseFloat(p.amount), 0);

          // 2. sum credit-card hits on this date
          const outflow = cards.reduce((sum, c) => {
            const dueDate = new Date(c.next_due_date);
            // first hit: exact next_due_date
            if (dueDate.toDateString() === pointer.toDateString()) {
              return sum + parseFloat(c.next_due_amount);
            }
            // subsequent hits: same day each month after next_due_date
            if (
              pointer > dueDate &&
              pointer.getDate() === dueDate.getDate() &&
              pointer >= addMonths(dueDate, 1)
            ) {
              return sum + parseFloat(c.avg_future_amount);
            }
            return sum;
          }, 0);

          balance = balance + inflow - outflow;
          points.push({ date: new Date(pointer), balance, inflow, outflow });

          pointer = tickFn(pointer, 1);
        }

        // ─── PREP DATA FOR CHART.JS ───────────────────────────────
        const labels = points.map((p) => p.date);
        setChartData({
          labels,
          datasets: [
            {
              type: 'line',
              label: 'Balance',
              data: points.map((p) => p.balance),
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59,130,246,0.2)',
              yAxisID: 'balance',
              tension: 0.3,
            },
            {
              type: 'bar',
              label: 'Cash Inflow',
              data: points.map((p) => p.inflow),
              backgroundColor: '#10b981',
              yAxisID: 'flow',
            },
            {
              type: 'bar',
              label: 'Cash Outflow',
              data: points.map((p) => -p.outflow),
              backgroundColor: '#ef4444',
              yAxisID: 'flow',
            },
          ],
        });

        // ─── CALC STATS ────────────────────────────────────────────
        const balances = points.map((p) => p.balance);
        const lowBalance = Math.min(...balances);
        const lowIndex = balances.indexOf(lowBalance);
        const lowDate = labels[lowIndex];

        // annualized growth
        const growth = currentBalance
          ? (((balance - currentBalance) * 12) / currentBalance) * 100
          : 0;

        const requiredBal = lowBalance < 0 ? -lowBalance : 0;
        const avgPay = paychecks.length
          ? paychecks.reduce((sum, p) => sum + parseFloat(p.amount), 0) /
            paychecks.length
          : 0;

        setStats({
          lowPoint: { date: lowDate, balance: lowBalance },
          growth: growth.toFixed(2),
          requiredBalance: requiredBal.toFixed(2),
          requiredPay: avgPay.toFixed(2),
        });
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAndBuild();
  }, [refresh, view]);

  if (loading)
    return (
      <div className={styles.card}>
        <h3>6-Month Projection</h3>
        <div className={styles.loading}>Loading projections…</div>
      </div>
    );
  if (error)
    return (
      <div className={styles.card}>
        <h3>6-Month Projection</h3>
        <div className={styles.error}>{error}</div>
      </div>
    );

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
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 350 }}>
        <Chart
          data={chartData}
          options={{
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            scales: {
              x: { type: 'time', time: { unit: view } },
              balance: {
                position: 'left',
                title: { display: true, text: 'Balance ($)' },
              },
              flow: {
                position: 'right',
                title: { display: true, text: 'Cash Flow ($)' },
                grid: { drawOnChartArea: false },
              },
            },
            plugins: { legend: { position: 'top' } },
          }}
        />
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <small>Lowest Point</small>
          <p className={styles.statValue}>
            {stats.lowPoint.date.toLocaleDateString()} @ ${stats.lowPoint.balance.toFixed(2)}
          </p>
          {stats.lowPoint.balance < 0 && (
            <p className={styles.statWarn}>⚠️ Below zero</p>
          )}
        </div>
        <div className={styles.statCard}>
          <small>Annualized Growth</small>
          <p className={styles.statValue}>{stats.growth}%</p>
        </div>
        <div className={styles.statCard}>
          <small>Required Starting Balance</small>
          <small>(to remain positive)</small>
          <p className={styles.statValue}>${stats.requiredBalance}</p>
        </div>
        <div className={styles.statCard}>
          <small>Required Paycheck</small>
          <p className={styles.statValue}>${stats.requiredPay}</p>
        </div>
      </div>
    </div>
  );
}
