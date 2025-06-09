// components/BalanceForm.js

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

// Utility to normalize null scenario
function normalizeScenarioId(scenarioId) {
  return !scenarioId || scenarioId === '' ? null : scenarioId;
}

export default function BalanceForm({ onSave, scenarioId }) {
  const [balance, setBalance] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBalance('');
        setMessage('No user logged in.');
        setLoading(false);
        return;
      }

      const normScenarioId = normalizeScenarioId(scenarioId);
      let query = supabase
        .from('accounts')
        .select('id, user_id, current_balance, scenario_id')
        .eq('user_id', user.id);

      if (normScenarioId) {
        query = query.eq('scenario_id', normScenarioId);
      } else {
        query = query.is('scenario_id', null);
      }

      const { data, error } = await query.maybeSingle();
      console.log('[fetchBalance] user_id:', user.id, 'scenarioId:', scenarioId, 'normScenarioId:', normScenarioId, 'Returned:', data, 'Error:', error);

      if (error && error.code !== 'PGRST116') {
        setMessage('Error fetching balance.');
        setBalance('');
        setLoading(false);
        return;
      }

      if (data && typeof data.current_balance !== 'undefined') {
        setBalance(data.current_balance);
      } else {
        setBalance('');
      }
    } catch (err) {
      setMessage('Exception fetching balance.');
      console.error('Balance fetch exception:', err);
      setBalance('');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBalance();
    // eslint-disable-next-line
  }, [scenarioId]);

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
      const payload = {
        user_id: user.id,
        current_balance: +balance,
        scenario_id: normScenarioId,
      };
      console.log('[handleSave] Upsert payload:', payload);

      const { data, error } = await supabase
        .from('accounts')
        .upsert(payload, { onConflict: ['user_id', 'scenario_id'] })
        .select();

      console.log('[handleSave] Upsert returned:', data, error);

      if (!error) {
        setMessage('Balance saved successfully!');
        setTimeout(() => setMessage(''), 3000);
        await fetchBalance();
        if (onSave) onSave();
      } else {
        setMessage('Error saving balance.');
        console.error('Save error:', error);
      }
    } catch (err) {
      setMessage('Unexpected error.');
      console.error('Save exception:', err);
    }
    setLoading(false);
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
          disabled={loading}
        />
      </div>

      <button
        className={styles.button}
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Balance'}
      </button>
    </div>
  );
}
