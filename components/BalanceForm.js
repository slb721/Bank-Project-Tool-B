// components/BalanceForm.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

export default function BalanceForm({ onSave, scenarioId }) {
  const [balance, setBalance] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchBalance() {
      const { data: { user } } = await supabase.auth.getUser();
      const query = supabase
        .from('accounts')
        .select('current_balance')
        .eq('user_id', user.id);

      if (scenarioId) query.eq('scenario_id', scenarioId);
      else query.is('scenario_id', null);

      const { data } = await query.single();
      if (data && data.current_balance !== undefined) {
        setBalance(data.current_balance);
      } else {
        setBalance('');
      }
    }
    fetchBalance();
  }, [scenarioId]);

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      user_id: user.id,
      current_balance: +balance,
      scenario_id: scenarioId || null,
    };

    const { error } = await supabase
      .from('accounts')
      .upsert(payload, { onConflict: ['user_id', 'scenario_id'] });

    if (!error) {
      setMessage('Balance saved successfully!');
      setTimeout(() => setMessage(''), 3000);
      onSave();
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>Current Balance</h2>
      {message && <div className={styles.success}>{message}</div>}

      <div className={styles.formGroup}>
        <label>Balance</label>
        <input
          type="number"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
        />
      </div>

      <button className={styles.button} onClick={handleSave}>
        Save Balance
      </button>
    </div>
  );
}
