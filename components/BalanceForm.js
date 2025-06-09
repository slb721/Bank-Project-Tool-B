// components/BalanceForm.js

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

function normalizeScenarioId(scenarioId) {
  // Always use the explicit default scenario ID
  return !scenarioId || scenarioId === '' ? '00000000-0000-0000-0000-000000000000' : scenarioId;
}

export default function BalanceForm({ onSave, scenarioId }) {
  const [balance, setBalance] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBalance();
    // eslint-disable-next-line
  }, [scenarioId]);

  const fetchBalance = async () => {
    setLoading(true);
    setMessage('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBalance('');
        setLoading(false);
        return;
      }
      const normScenarioId = normalizeScenarioId(scenarioId);
      // Find or create the default scenario for this user if missing
      if (normScenarioId === '00000000-0000-0000-0000-000000000000') {
        // Ensure scenario exists for this user
        const { data: existingDefault } = await supabase
          .from('scenarios')
          .select('id')
          .eq('id', normScenarioId)
          .eq('user_id', user.id)
          .maybeSingle();
        if (!existingDefault) {
          await supabase.from('scenarios').insert({
            id: normScenarioId,
            user_id: user.id,
            name: 'Default'
          });
        }
      }
      const { data, error } = await supabase
        .from('accounts')
        .select('current_balance, id')
        .eq('user_id', user.id)
        .eq('scenario_id', normScenarioId)
        .order('updated_at', { ascending: false })
        .maybeSingle();
      if (error) {
        setBalance('');
      } else {
        setBalance(data ? data.current_balance : '');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage('Not signed in.');
        setLoading(false);
        return;
      }
      const normScenarioId = normalizeScenarioId(scenarioId);
      // Find existing row
      const { data: existingRow } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .eq('scenario_id', normScenarioId)
        .maybeSingle();

      let result;
      if (existingRow) {
        result = await supabase
          .from('accounts')
          .update({ current_balance: +balance })
          .eq('id', existingRow.id);
      } else {
        result = await supabase
          .from('accounts')
          .insert({
            user_id: user.id,
            scenario_id: normScenarioId,
            current_balance: +balance
          });
      }
      const { error } = result;
      if (!error) {
        setMessage('Saved successfully!');
        setTimeout(() => setMessage(''), 3000);
        if (onSave) onSave();
      } else {
        setMessage('Error saving balance: ' + (error.message || JSON.stringify(error)));
      }
    } finally {
      setLoading(false);
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
          onChange={e => setBalance(e.target.value)}
          disabled={loading}
        />
      </div>
      <button className={styles.button} onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}
