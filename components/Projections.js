import { useEffect, useState } from 'react';
import { supabase, TEST_USER_ID } from '../lib/supabaseClient';
import { Line } from 'react-chartjs-2';
import { addWeeks, addMonths, parseISO, format } from 'date-fns';

export default function Projections() {
  const [data, setData] = useState(null);
  const [lowPoint, setLowPoint] = useState(null);
  const [annualGrowth, setAnnualGrowth] = useState(null);
  const [negativeAlert, setNegativeAlert] = useState(null);

  useEffect(() => {
    async function fetchAndCompute() {
      const { data: acctData } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', TEST_USER_ID)
        .single();
      const { data: pcData } = await supabase
        .from('paychecks')
        .select('*')
        .eq('user_id', TEST_USER_ID);
      const { data: ccData } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', TEST_USER_ID);

      if (!acctData) return;
      let balance = parseFloat(acctData.current_balance);
      const today = new Date();
      let weeklyData = [];
      let minBal = balance;
      let minDate = today;
      let firstBalance = balance;

      for (let i = 0; i < 52; i++) {
        const weekDate = addWeeks(today, i);

        for (const pc of pcData) {
          let nextPay = parseISO(pc.next_date);
          while (nextPay <= weekDate) {
            balance += parseFloat(pc.amount);
            if (pc.schedule === 'weekly') nextPay = addWeeks(nextPay, 1);
            else if (pc.schedule === 'biweekly')
              nextPay = addWeeks(nextPay, 2);
            else nextPay = addMonths(nextPay, 1);
          }
        }

        for (const cc of ccData) {
          let due = parseISO(cc.next_due_date);
          if (due >= weekDate && due < addWeeks(weekDate, 1)) {
            balance -= parseFloat(cc.next_due_amount);
            due = addMonths(due, 1);
          }
        }

        weeklyData.push({ date: weekDate, balance });
        if (balance < minBal) {
          minBal = balance;
          minDate = weekDate;
        }
      }

      setLowPoint({ date: minDate, balance: minBal });
      const lastBalance = weeklyData[weeklyData.length - 1].balance;
      const growth = ((lastBalance / firstBalance - 1) * 100).toFixed(2);
      setAnnualGrowth(growth);
      const negWeek = weeklyData.find((w) => w.balance < 0);
      if (negWeek) setNegativeAlert(negWeek.date);

      const labels = weeklyData.map((w) => format(w.date, 'MM/dd/yyyy'));
      const balances = weeklyData.map((w) => w.balance);
      setData({
        labels,
        datasets: [
          {
            label: 'Balance',
            data: balances,
            fill: false,
            borderColor: 'blue',
          },
        ],
      });
    }

    fetchAndCompute();
  }, []);

  if (!data) return null;

  return (
    <div style={{ marginTop: 40 }}>
      <h2>12-Month Projection</h2>
      <Line data={data} />
      <div style={{ marginTop: 20 }}>
        <p>
          <strong>Lowest Point:</strong> {format(lowPoint.date, 'MM/dd/yyyy')} at $
          {lowPoint.balance.toFixed(2)}
        </p>
        <p>
          <strong>Annualized Growth:</strong> {annualGrowth}%
        </p>
        {negativeAlert && (
          <p style={{ color: 'red' }}>
            ⚠️ Balance goes below zero on {format(negativeAlert, 'MM/dd/yyyy')}
          </p>
        )}
      </div>
    </div>
  );
}
