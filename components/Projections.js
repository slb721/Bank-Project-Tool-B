// components/Projections.js

import { useEffect, useState } from 'react';
import { supabase, TEST_USER_ID } from '../lib/supabaseClient';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import {
  addDays,
  addWeeks,
  addMonths,
  parseISO,
  format,
  isSameDay,
  isBefore,
  startOfDay,
} from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Projections({ refresh }) {
  const [view, setView] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
  const [chartData, setChartData] = useState(null);
  const [stats, setStats] = useState({ lowPoint: null, negDay: null, growth: 0, reqBalance: 0, reqPay: 0 });

  useEffect(() => {
    async function fetchAndCompute() {
      // --- 1. Fetch data ---
      const { data: acctData } = await supabase
        .from('accounts').select('current_balance').eq('user_id', TEST_USER_ID).single();
      if (!acctData) return setChartData(null);

      const { data: pcData } = await supabase
        .from('paychecks').select('amount, schedule, next_date').eq('user_id', TEST_USER_ID);
      const { data: ccData } = await supabase
        .from('credit_cards').select('next_due_date, next_due_amount, avg_future_amount').eq('user_id', TEST_USER_ID);

      // --- 2. Horizon & step based on view ---
      const startDate = startOfDay(new Date());
      const endDate = addMonths(startDate, 6);
      let stepFn, labelFmt;
      if (view === 'weekly') {
        stepFn = (d) => addWeeks(d, 1);
        labelFmt = 'MM/dd';
      } else if (view === 'monthly') {
        stepFn = (d) => addMonths(d, 1);
        labelFmt = 'MMM yy';
      } else {
        stepFn = (d) => addDays(d, 1);
        labelFmt = 'MM/dd';
      }

      // --- 3. Build events list ---
      const events = [];
      for (const pc of pcData) {
        let np = parseISO(pc.next_date);
        while (!isBefore(endDate, np)) {
          events.push({ date: startOfDay(np), amount: +pc.amount });
          np = pc.schedule === 'weekly'
            ? addWeeks(np, 1)
            : pc.schedule === 'biweekly'
            ? addWeeks(np, 2)
            : addMonths(np, 1);
        }
      }
      for (const cc of ccData) {
        let cd = parseISO(cc.next_due_date), first=true;
        while (!isBefore(endDate, cd)) {
          events.push({
            date: startOfDay(cd),
            amount: first ? -cc.next_due_amount : -cc.avg_future_amount,
          });
          first = false;
          cd = addMonths(cd, 1);
        }
      }
      events.sort((a,b)=>a.date-b.date);

      // --- 4. Iterate through dates ---
      const labels = [];
      const balances = [];
      const flows = [];
      let balance = +acctData.current_balance;
      let simBal=0, minSim=0, payCount=0, expenseSum=0;
      let minBal = balance, minDate = startDate, negDay = null;

      let idx=0;
      for (let curr=startDate; !isBefore(endDate, curr); curr = stepFn(curr)) {
        let dailyFlow=0;
        // process events for this day
        while (idx<events.length && isSameDay(events[idx].date, curr)) {
          const amt = events[idx++].amount;
          dailyFlow += amt;
          if (amt>0) payCount++; else expenseSum += -amt;
        }
        balance += dailyFlow;
        simBal += dailyFlow;

        if (balance<minBal) { minBal=balance; minDate=curr; }
        if (simBal<minSim) minSim=simBal;
        if (negDay===null && balance<0) negDay = format(curr,'MM/dd/yyyy');

        labels.push(format(curr,labelFmt));
        balances.push(balance);
        flows.push(dailyFlow);
      }

      // --- 5. Stats ---
      const requiredBalance = Math.max(0, -minSim).toFixed(2);
      const requiredPay = payCount>0 ? (expenseSum/payCount).toFixed(2) : '0.00';
      const growth = (((balances[balances.length-1]/+acctData.current_balance-1)*2)*100).toFixed(2);

      setStats({ lowPoint:{date:minDate,balance:minBal}, negDay, growth, requiredBalance, requiredPay });

      // --- 6. Chart data ---
      setChartData({
        labels,
        datasets: [
          {
            type: 'line',
            label: 'Balance',
            data: balances,
            yAxisID: 'y',
            borderColor: '#3b82f6',
            backgroundColor: '#3b82f6',
            fill: false,
            tension: 0.1,
            pointRadius: view==='daily'?0:3,
          },
          {
            type: 'bar',
            label: 'Daily Flow',
            data: flows,
            yAxisID: 'y1',
            backgroundColor: flows.map(f=>f>=0?'#10b981':'#ef4444'),
          },
        ],
      });
    }

    fetchAndCompute();
  }, [refresh, view]);

  if (!chartData) return <p className="text-center py-8">Loading projections…</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg space-y-6">
      <h2 className="text-2xl font-semibold">6-Month Projection</h2>

      {/* 1. View toggle */}
      <div className="flex space-x-2">
        {['daily','weekly','monthly'].map(v => (
          <button
            key={v}
            onClick={()=>setView(v)}
            className={`px-4 py-1 rounded-full border ${
              view===v
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            {v.charAt(0).toUpperCase()+v.slice(1)}
          </button>
        ))}
      </div>

      {/* 2. Chart */}
      <div className="relative h-96">
        <Chart
          type="bar"
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { grid: { display: false }, ticks:{maxTicksLimit:12} },
              y: {
                type: 'linear',
                position: 'left',
                title: { display: true, text: 'Balance ($)' },
                beginAtZero: false,
              },
              y1: {
                type: 'linear',
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

      {/* 3. Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-500">Lowest Point</p>
          <p className="font-medium">
            {format(stats.lowPoint.date,'MM/dd/yyyy')} @ ${stats.lowPoint.balance.toFixed(2)}
          </p>
          {stats.negDay && <p className="text-red-500 mt-1">⚠️ Below zero on {stats.negDay}</p>}
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-500">Annualized Growth</p>
          <p className="font-medium">{stats.growth}%</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-500">Required Starting Balance</p>
          <p className="font-medium">${stats.requiredBalance}</p>
          <p className="text-sm text-gray-500">Required Paycheck</p>
          <p className="font-medium">${stats.requiredPay}</p>
        </div>
      </div>
    </div>
  );
}
