// components/Projections.js
import React, { useEffect, useState } from 'react';
import styles from '../styles/Dashboard.module.css';
import { supabase } from '../lib/supabaseClient';
import { format } from 'date-fns';

export default function Projections({ refresh }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    lowPoint: { date: new Date(), balance: 0 },
    negDay: null,
    growth: '0.00',
    requiredBalance: '0.00',
    requiredPay: '0.00',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        const { data: account } = await supabase
          .from('accounts')
          .select('current_balance')
          .eq('user_id', user.id)
          .single();

        const { data: paychecks } = await supabase
          .from('paychecks')
          .select('amount, schedule, next_date')
          .eq('user_id', user.id);

        const { data: creditCards } = await supabase
          .from('credit_cards')
          .select('next_due_date, next_due_amount, avg_future_amount')
          .eq('user_id', user.id);

        const currentBalance = account?.current_balance || 0;
        const totalCardOutflow = creditCards?.reduce((sum, cc) => sum + parseFloat(cc.avg_future_amount || 0), 0) || 0;
        const totalPaychecks = paychecks?.reduce((sum, pc) => sum + parseFloat(pc.amount || 0), 0) || 0;

        const projectedBalance = currentBalance + totalPaychecks - totalCardOutflow;
        const lowestBalance = Math.min(currentBalance, projectedBalance);
        const requiredBalance = Math.max(0, -lowestBalance);
        const requiredPay = totalCardOutflow / 1; // Assume at least 1 pay period is needed

        const monthlyGrowth = projectedBalance - currentBalance;
        const annualizedGrowth = currentBalance > 0 ? ((monthlyGrowth * 12) / currentBalance) * 100 : 0;

        setStats({
          lowPoint: { 
            date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // rough placeholder
            balance: lowestBalance
          },
          negDay: lowestBalance < 0 ? format(new Date(), 'MM/dd/yyyy') : null,
          growth: annualizedGrowth.toFixed(2),
          requiredBalance: requiredBalance.toFixed(2),
          requiredPay: requiredPay.toFixed(2),
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [refresh]);

  if (loading) return <div className={styles.card}><h3>6-Month Projection</h3><div className={styles.loading}>Loading...</div></div>;
  if (error) return <div className={styles.card}><h3>6-Month Projection</h3><div className={styles.error}>{error}</div></div>;

  return (
    <div className={styles.card}>
      <h3 className={styles.heading}>6-Month Projection</h3>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <small>Lowest Point</small>
          <p className={styles.statValue}>
            {format(stats.lowPoint.date, 'MM/dd/yyyy')} @ ${stats.lowPoint.balance.toFixed(2)}
          </p>
          {stats.negDay && (
            <p className={styles.statWarn}>⚠️ Below zero on {stats.negDay}</p>
          )}
        </div>

        <div className={styles.statCard}>
          <small>Annualized Growth</small>
          <p className={styles.statValue}>{stats.growth}%</p>
        </div>

        <div className={styles.statCard}>
          <small>Required Starting Balance</small>
          <p className={styles.statValue}>${stats.requiredBalance}</p>
          <small className={styles.subtext}>(to remain positive)</small>
        </div>

        <div className={styles.statCard}>
          <small>Required Monthly Income</small>
          <p className={styles.statValue}>${stats.requiredPay}</p>
        </div>
      </div>
    </div>
  );
}
