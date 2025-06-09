// components/BalanceForm.js

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

// Utility to normalize scenarioId
function normalizeScenarioId(scenarioId) {
  return !scenarioId || scenarioId === '' ? null : scenarioId;
}

export default function BalanceForm({ onSave, scenarioId }) {
  const [balance, setBalance] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch all rows for this user, then filter for scenarioId (or null) in JavaScript
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

      // Always fetch all rows for this user
      const { data, error } = await supabase
        .from('accounts')
        .select('id, user_id, current_balance, scenario_id')
        .eq('user_id', user.id);

      if (error) {
        setMessage('Error fetching balance.');
        setBalance('');
        setLoading(false);
        return;
      }

      const normScenarioId = normalizeScenarioId(scenarioId);
      // Filter for the right scenario row (null for Default)
      let row;
      if (normScenarioId) {
        row = data.find(r => r.scenario_id === normScenarioId);
      } else {
        row = data.find(r => r.scenario_id === null);
      }

      if (row && typeof row.current_balance !== 'undefined') {
        setBalance(row.current_balance);
      } else {
        setBalance('');
      }
    } catch (err) {
      setMessage('Exception fetching balance.');
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

      const { error } = await supabase
        .from('accounts')
        .upsert(payload, { onConflict: ['user_id', 'scenario_id'] });

      if (!error) {
        setMessage('Balance saved successfully!');
        setTimeout(() => setMessage(''), 3000);
        await fetchBalance();
        if (onSave) onSave();
      } else {
        setMessage('Error saving balance.');
      }
    } catch (err) {
      setMessage('Unexpected error.');
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
