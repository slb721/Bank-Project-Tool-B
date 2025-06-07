// components/Projections.js - Simplified version

import React, { useEffect, useState } from 'react';
import styles from '../styles/Dashboard.module.css';
import { supabase } from '../lib/supabaseClient';

export default function Projections({ refresh }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    lowPoint: { date: new Date(), balance: 0 },
    growth: '0.00',
    requiredBalance: '0.00',
    requiredPay: '0.00',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setError('User not authenticated');
          return;
        }

        console.log('Fetching data for user:', user.id);

        // Fetch account data
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .select('current_balance')
          .eq('user_id', user.id)
          .single();

        if (accountError) {
          console.error('Account fetch error:', accountError);
          if (accountError.code === 'PGRST116') {
            setError('No account data found. Please set your balance first.');
          } else {
            setError('Failed to fetch account data');
          }
          return;
        }

        // Fetch paychecks
        const { data: paychecks, error: paycheckError } = await supabase
          .from('paychecks')
          .select('amount, schedule, next_date')
          .eq('user_id', user.id);

        if (paycheckError) {
          console.error('Paycheck fetch error:', paycheckError);
        }

        // Fetch credit cards
        const { data: creditCards, error: creditCardError } = await supabase
          .from('credit_cards')
          .select('next_due_date, next_due_amount, avg_future_amount')
          .eq('user_id', user.id);

        if (creditCardError) {
          console.error('Credit card fetch error:', creditCardError);
        }

        console.log('Fetched data:', { account, paychecks, creditCards });

        // Simple calculations
        const currentBalance = account?.current_balance || 0;
        const totalPaychecks = (paychecks || []).reduce((sum, pc) => sum + parseFloat(pc.amount || 0), 0);
        const totalCards = (creditCards || []).reduce((sum, cc) => sum + parseFloat(cc.avg_future_amount || 0), 0);
        
        // Calculate lowest point (simplified)
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        const projectedBalance = currentBalance + totalPaychecks - totalCards;
        const lowestBalance = Math.min(currentBalance, projectedBalance);
        
        // Calculate required amounts
        const requiredBalance = Math.max(0, -lowestBalance);
        const requiredPay = totalCards > 0 ? (totalCards / (paychecks?.length || 1)) : 0;
        
        // Calculate growth (annualized)
        const monthlyGrowth = projectedBalance - currentBalance;
        const annualizedGrowth = currentBalance > 0 ? ((monthlyGrowth * 12) / currentBalance) * 100 : 0;

        setStats({
          lowPoint: { 
            date: nextMonth, 
            balance: lowestBalance 
          },
          growth: annualizedGrowth.toFixed(2),
          requiredBalance: requiredBalance.toFixed(2),
          requiredPay: requiredPay.toFixed(2),
        });

      } catch (err) {
        console.error('Error in projections:', err);
        setError('An unexpected error occurred: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [refresh]);

  if (loading) {
    return (
      <div className={styles.card}>
        <h3>6-Month Projection</h3>
        <div className={styles.loading}>Loading projections...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.card}>
        <h3>6-Month Projection</h3>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h3>6-Month Projection</h3>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <small>Lowest Point</small>
          <p className={styles.statValue}>
            {stats.lowPoint.date.toLocaleDateString()} @ ${stats.lowPoint.balance.toFixed(2)}
          </p>
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
