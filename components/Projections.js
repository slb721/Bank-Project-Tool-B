// components/Projections.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  startOfToday,
  addDays,
  addWeeks,
  addMonths,
  isBefore,
  parseISO,
  format,
} from 'date-fns';
import Chart from './Chart';

export default function Projections({ refresh }) {
  const [balance, setBalance] = useState(0);
  const [paychecks, setPaychecks] = useState([]);
  const [cards, setCards] = useState([]);
  const [view, setView] = useState('monthly');
  const [data, setData] = useState([]);
  const [lowestPoint, setLowestPoint] = useState(null);
  const [growthRate, setGrowthRate] = useState(null);
  const [requiredStart, setRequiredStart] = useState(null);
  const [requiredPaycheck, setRequiredPaycheck] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data: balData } = await supabase.from('balances').select().order('id', { ascending: false }).limit(1);
      const { data: pData } = await supabase.from('paychecks').select();
      const { data: cData } = await supabase.from('cards').select();

      setBalance(balData?.[0]?.amount || 0);
      setPaychecks(pData || []);
      setCards(cData || []);
    };

    load();
  }, [refresh]);

  useEffect(() => {
    if (cards.length === 0) return;

    const today = startOfToday();
    const projectionDays = 180;
    const projected = [];
    let running = balance;
    let minBalance = balance;
    let lastDate = today;

    for (let i = 0; i <= projectionDays; i++) {
      const date = addDays(today, i);

      // Apply paychecks
      paychecks.forEach((p) => {
        const firstDate = parseISO(p.next_date);
        const schedule = p.schedule;
        let nextPay = firstDate;

        while (isBefore(nextPay, date) || format(nextPay, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')) {
          if (format(nextPay, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')) {
            running += p.amount;
            break;
          }

          if (schedule === 'biweekly') nextPay = addWeeks(nextPay, 2);
          else if (schedule === 'weekly') nextPay = addWeeks(nextPay, 1);
          else if (schedule === 'monthly') nextPay = addMonths(nextPay, 1);
          else break;
        }
      });

      // Apply credit card charges
      cards.forEach((card) => {
        const nextDue = parseISO(card.next_due);
        const avg = card.avg_amount;
        let due = nextDue;

        while (isBefore(due, date) || format(due, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')) {
          if (format(due, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')) {
            running -= avg;
            break;
          }
          due = addMonths(due, 1);
        }
      });

      projected.push({ date, balance: running });
      if (running < minBalance) {
        minBalance = running;
        lastDate = date;
      }
    }

    setData(projected);
    setLowestPoint({ date: lastDate, value: minBalance });

    const final = projected[projected.length - 1].balance;
    const growth = ((final - balance) / Math.abs(balance || 1)) * 100;
    setGrowthRate(growth.toFixed(2));

    // Correct required starting balance
    const lowest = projected.reduce((min, d) => (d.balance < min ? d.balance : min), balance);
    setRequiredStart(lowest < 0 ? (balance - lowest).toFixed(2) : 0);

    // Correct required paycheck
    if (paychecks.length > 0 && cards.length > 0) {
      const template = paychecks[0];
      const intervalDays =
        template.schedule === 'biweekly' ? 14 :
        template.schedule === 'weekly' ? 7 :
        template.schedule === 'monthly' ? 30 : null;

      if (intervalDays) {
        const trial = (amt) => {
          let r = balance;
          for (let i = 0; i <= projectionDays; i++) {
            const date = addDays(today, i);
            // Add paycheck
            if ((i % intervalDays) === 0) r += amt;

            // Subtract all card avg charges
            cards.forEach((card) => {
              const nextDue = parseISO(card.next_due);
              let due = nextDue;
              while (isBefore(due, date) || format(due, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')) {
                if (format(due, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')) {
                  r -= card.avg_amount;
                  break;
                }
                due = addMonths(due, 1);
              }
            });

            if (r < 0) return false;
          }
          return true;
        };

        // Binary search paycheck
        let lo = 0, hi = 10000, res = null;
        while (hi - lo > 1) {
          const mid = (lo + hi) / 2;
          if (trial(mid)) {
            res = mid;
            hi = mid;
          } else {
            lo = mid;
          }
        }
        setRequiredPaycheck(res ? res.toFixed(2) : 'N/A');
      } else {
        setRequiredPaycheck('');
      }
    } else {
      setRequiredPaycheck('');
    }
  }, [balance, paychecks, cards]);

  return (
    <div className="card chartWide">
      <div className="chartHeader">
        <h3 className="chartTitle">6-Month Projection</h3>
        <div className="btnGroup">
          {['daily', 'weekly', 'monthly'].map((v) => (
            <button
              key={v}
              className={`button ${view === v ? 'active' : ''}`}
              onClick={() => setView(v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <Chart data={data} view={view} />

      <div className="statsGrid">
        <div className="statCard">
          <small>Lowest Point</small>
          <div className="statValue">
            {lowestPoint ? `${format(lowestPoint.date, 'MM/dd/yyyy')} @ $${lowestPoint.value.toFixed(2)}` : '—'}
          </div>
        </div>

        <div className="statCard">
          <small>Annualized Growth</small>
          <div className="statValue">{growthRate}%</div>
        </div>

        <div className="statCard">
          <small>Required Starting Balance</small>
          <div className="statValue">
            {requiredStart === null ? '—' : `$${requiredStart}`}
          </div>
        </div>

        <div className="statCard">
          <small>Required Paycheck ({paychecks?.[0]?.schedule || 'Biweekly'})</small>
          <div className="statValue">
            {requiredPaycheck ? `$${requiredPaycheck}` : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
