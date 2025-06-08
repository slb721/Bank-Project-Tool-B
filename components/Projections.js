// components/Projections.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Filler,
  CategoryScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Filler,
  CategoryScale
);

export default function Projections({ refresh }) {
  const [dataPoints, setDataPoints] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: balanceData }, { data: cardData }, { data: payData }] = await Promise.all([
        supabase.from('balances').select('*').eq('user_id', user.id),
        supabase.from('credit_cards').select('*').eq('user_id', user.id),
        supabase.from('paychecks').select('*').eq('user_id', user.id),
      ]);

      const balance = balanceData?.[0]?.amount || 0;
      const today = new Date();
      const days = 180;
      const projections = [];
      let current = balance;

      const cardMap = {};
      cardData.forEach(card => {
        const due = new Date(card.next_due_date);
        cardMap[due.toDateString()] = (cardMap[due.toDateString()] || 0) + parseFloat(card.next_due_amount);
      });

      const paycheckMap = {};
      payData.forEach(pay => {
        let date = new Date(pay.next_pay_date);
        const interval = pay.schedule === 'biweekly' ? 14 : 30;
        for (let i = 0; i < days; i += interval) {
          const key = date.toDateString();
          paycheckMap[key] = (paycheckMap[key] || 0) + parseFloat(pay.amount);
          date = new Date(date);
          date.setDate(date.getDate() + interval);
        }
      });

      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toDateString();

        const inAmt = paycheckMap[dateStr] || 0;
        const outAmt = cardMap[dateStr] || 0;
        current += inAmt - outAmt;

        projections.push({
          x: new Date(date),
          y: current
        });
      }

      const lows = projections.map(p => p.y);
      const min = Math.min(...lows);
      const minDate = projections[lows.indexOf(min)].x;

      const start = projections[0].y;
      const end = projections[projections.length - 1].y;
      const growth = ((end - start) / start) * (365 / days) * 100;

      const avgCardMonthly = cardData.reduce((acc, c) => acc + parseFloat(c.avg_future_amount || 0), 0);
      const requiredPaycheck = avgCardMonthly;

      const requiredStartBalance = projections.find(p => p.y < 0)?.y ?? 0;

      setStats({
        lowestPoint: `${minDate.toLocaleDateString()} @ $${min.toFixed(2)}`,
        annualizedGrowth: `${growth.toFixed(2)}%`,
        requiredStart: `$${(requiredStartBalance < 0 ? -requiredStartBalance : 0).toFixed(2)}`,
        requiredPaycheck: `$${requiredPaycheck.toFixed(2)}`
      });

      setDataPoints(projections);
    };

    fetchData();
  }, [refresh]);

  const chartData = {
    datasets: [
      {
        label: 'Projection',
        data: dataPoints,
        fill: true,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.3
      }
    ]
  };

  const options = {
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'week'
        },
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Balance ($)'
        }
      }
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>6-Month Projection</h2>
      <Line data={chartData} options={options} />
      <div className={styles.statsBox}>
        <p><strong>Lowest Point:</strong> {stats.lowestPoint}</p>
        <p><strong>Annualized Growth:</strong> {stats.annualizedGrowth}</p>
        <p><strong>Required Starting Balance (to remain positive):</strong> {stats.requiredStart}</p>
        <p><strong>Required Paycheck:</strong> {stats.requiredPaycheck}</p>
      </div>
    </div>
  );
}
