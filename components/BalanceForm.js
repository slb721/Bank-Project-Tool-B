import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

function normalizeScenarioId(scenarioId) {
  return (
    !scenarioId ||
    scenarioId === '' ||
    scenarioId === '00000000-0000-0000-0000-000000000000'
  )
    ? null
    : scenarioId;
}

export default function BalanceForm({ onSave, scenarioId, refresh }) {
  const [balance, setBalance] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchBalance(); }, [scenarioId, refresh]);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBalance('');
        setLoading(false);
        return;
      }
      const normScenarioId = normalizeScenarioId(scenarioId);
      let query = supabase.from('accounts').select('*').eq('user_id', user.id);
      if (normScenarioId === null) {
        query = query.is('scenario_id', null);
      } else {
        query = query.eq('scenario_id', normScenarioId);
      }
      const { data, error } = await query.order('updated_at', { ascending: false });
      let row = (data || []).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
      setBalance(row && typeof row.current_balance !== 'undefined' ? row.current_balance : '');
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
      const payload = {
        user_id: user.id,
        scenario_id: normScenarioId,
        current_balance: +balance,
      };
      // Upsert by user_id + scenario_id
      const { error } = await supabase.from('accounts').upsert(payload, {
        onConflict: 'user_id,scenario_id',
      });
      if (!error) {
        setMessage('Saved successfully.');
        setTimeout(() => setMessage(''), 1500);
        fetchBalance();
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
      <h2>Current Balance</h2>
      {message && <div className={styles.success}>{message}</div>}
      <div className={styles.formGroup}>
        <label>Enter Current Account Balance</label>
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
