// components/Projections.js

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Chart from 'chart.js/auto';
import { Line } from 'react-chartjs-2';
import styles from '../styles/Dashboard.module.css';

const getNextDates = (start, freq, count = 12) => {
  const dates = [];
  const ms = {
    weekly: 7,
    biweekly: 14,
    monthly: 30,
  }[freq.toLowerCase()];
  for (let i = 0; i < count; i++) {
    const next = new Date(start);
    next.setDate(next.getDate() + i * ms);
    dates.push(next);
  }
  return dates;
};

const getTotalOutflows = (cards, days) => {
  return cards.reduce((sum, c) => sum + parseFloat(c.average_amount || 0) * (days / 30), 0);
};

export default function Projections({ refresh }) {
  const [balance, setBalance] = useState(0);
  const [paychecks, setPaychecks] = useState([]);
  const [cards, setCards] = useState([]);
  const [interval, setInterval] = useState('daily');
  const [chartData, setChartData] = useState(null);
  const [lowest, setLowest] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [requiredStart, setRequiredStart] = useState(null);
  const [requiredPaycheck, setRequiredPaycheck] = useState(null);

  const today = new Date();
  const days = 180;

  useEffect(() => {
    const fetchAll = async () => {
      const { data: balanceData } = await supabase.from('balances').select('*').single();
      setBalance(parseFloat(balanceData?.amount || 0));

      const { data: paycheckData } = await supabase.from('paychecks').select('*');
      setPaychecks(paycheckData || []);

      const { data: cardData } = await supabase.from('credit_cards').select('*');
      setCards(cardData || []);
    };
    fetchAll();
  }, [refresh]);

  useEffect(() => {
    if (!balance && cards.length === 0) return;

    const dates = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() + i);
      return d;
    });

    const paycheckEvents = [];
    paychecks.forEach((p) => {
      const start = new Date(p.next_date);
      const frequency = p.schedule.toLowerCase();
      const amount = parseFloat(p.amount || 0);
      const schedule = getNextDates(start, frequency, 30);
      schedule.forEach((d) => {
        if (d >= today && d <= dates[dates.length - 1]) {
          paycheckEvents.push({ date: d.toDateString(), amount });
        }
      });
    });

    const cardEvents = [];
    cards.forEach((c) => {
      const start = new Date(c.next_due_date);
      const avgAmount = parseFloat(c.average_amount || 0);
      const schedule = getNextDates(start, 'monthly', 6);
      schedule.forEach((d) => {
        cardEvents.push({ date: d.toDateString(), amount: -avgAmount });
      });
    });

    const map = new Map();
    paycheckEvents.forEach(({ date, amount }) => {
      map.set(date, (map.get(date) || 0) + amount);
    });
    cardEvents.forEach(({ date, amount }) => {
      map.set(date, (map.get(date) || 0) + amount);
    });

    const values = [];
    let running = balance;
    let min = balance;
    dates.forEach((d) => {
      const key = d.toDateString();
      running += map.get(key) || 0;
      values.push(running);
      if (running < min) min = running;
    });

    const initial = balance;
    const final = values[values.length - 1];
    const annualized = ((final - initial) / initial) * (365 / days) * 100;

    setChartData({
      labels: dates.map((d) => d.toLocaleDateString()),
      datasets: [
        {
          label: 'Balance',
          data: values,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
        },
      ],
    });

    setLowest(min);
    setGrowth(annualized.toFixed(2));

    // Required Starting Balance
    const offset = balance - min;
    setRequiredStart(offset < 0 ? Math.abs(offset).toFixed(2) : '0.00');

    // Required Paycheck
    if (cards.length > 0 && paychecks.length > 0) {
      const nextDate = new Date(paychecks[0].next_date);
      const frequency = paychecks[0].schedule.toLowerCase();
      const payPeriods = Math.floor(days / (frequency === 'biweekly' ? 14 : 30));
      const outflowTotal = getTotalOutflows(cards, days);
      const requiredPerCheck = (outflowTotal / payPeriods).toFixed(2);
      setRequiredPaycheck(requiredPerCheck);
    } else {
      setRequiredPaycheck(null);
    }
  }, [balance, paychecks, cards, interval]);

  return (
    <>
      <div className={`${styles.card} ${styles.chartWide}`}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>6-Month Projection</h3>
          <div className={styles.btnGroup}>
            {['daily', 'weekly', 'monthly'].map((opt) => (
              <button
                key={opt}
                className={`${styles.button} ${interval === opt ? styles.active : ''}`}
                onClick={() => setInterval(opt)}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {chartData && <Line data={chartData} />}
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <small>Lowest Point</small>
          <div className={styles.statValue}>${lowest?.toFixed(2)}</div>
        </div>
        <div className={styles.statCard}>
          <small>Annualized Growth</small>
          <div className={styles.statValue}>{growth}%</div>
        </div>
        <div className={styles.statCard}>
          <small>Required Starting Balance</small>
          <div className={styles.statValue}>${requiredStart}</div>
        </div>
        <div className={styles.statCard}>
          <small>Required Paycheck (Biweekly)</small>
          <div className={styles.statValue}>
            {requiredPaycheck ? `$${requiredPaycheck}` : '--'}
          </div>
          <div className={styles.subtext}>Only calculated if paychecks and cards are both defined</div>
        </div>
      </div>
    </>
  );
}
