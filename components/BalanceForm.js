// components/BalanceForm.js

import React, { useState, useEffect } from 'react';
import { supabase, TEST_USER_ID } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

export default function BalanceForm({ onSave }) {
  const [balance, setBalance] = useState('');
  const [alert, setAlert] = useState('');

  // Load existing balance on mount
  useEffect(() => {
    async function fetchBalance() {
      const { data } = await supabase
        .from('accounts')
        .select('current_balance')
        .eq('user_id', TEST_USER_ID)
        .single();
      if (data) setBalance(data.current_balance);
    }
    fetchBalance();
  }, []);

  const handleSave = async () => {
    setAlert('');
    const payload = {
      user_id: TEST_USER_ID,
      current_balance: balance,
    };
    const { error } = await supabase
      .from('accounts')
      .upsert(payload, { onConflict: ['user_id'] });
    if (error) setAlert(error.message);
    else onSave();
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>Current Balance</h2>

      <div className={styles.formControl}>
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
      {alert && <div className={styles.alert}>{alert}</div>}
    </div>
  );
}
