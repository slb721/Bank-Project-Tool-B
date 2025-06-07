// components/BalanceForm.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

export default function BalanceForm({ onSave }) {
  const [balance, setBalance] = useState('');
  const [alert, setAlert] = useState('');
  const [user, setUser] = useState(null);

  // Get current user
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  // Load existing balance on mount
  useEffect(() => {
    if (!user) return;
    
    async function fetchBalance() {
      const { data } = await supabase
        .from('accounts')
        .select('current_balance')
        .eq('user_id', user.id)
        .single();
      if (data) setBalance(data.current_balance);
    }
    fetchBalance();
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      setAlert('User not authenticated');
      return;
    }

    setAlert('');
    const payload = {
      user_id: user.id,
      current_balance: balance,
    };

    const { error } = await supabase
      .from('accounts')
      .upsert(payload, { onConflict: ['user_id'] });

    if (error) setAlert(error.message);
    else onSave();
  };

  if (!user) {
    return <div>Loading...</div>;
  }

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