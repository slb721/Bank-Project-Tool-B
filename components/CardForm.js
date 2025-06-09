// components/CardForm.js

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

function normalizeScenarioId(scenarioId) {
  return !scenarioId || scenarioId === '' ? null : scenarioId;
}

export default function CardForm({ onSave, scenarioId }) {
  const [nextDueDate, setNextDueDate] = useState('');
  const [nextDueAmount, setNextDueAmount] = useState('');
  const [avgFutureAmount, setAvgFutureAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch and update when scenario changes
  useEffect(() => {
    fetchCard();
    // eslint-disable-next-line
  }, [scenarioId]);

  const fetchCard = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNextDueDate('');
        setNextDueAmount('');
        setAvgFutureAmount('');
        setMessage('No user logged in.');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('credit_cards')
        .select('id, user_id, next_due_date, next_due_amount, avg_future_amount, scenario_id, updated_at')
        .eq('user_id', user.id);

      if (error) {
        setMessage('Error fetching card.');
        setNextDueDate('');
        setNextDueAmount('');
        setAvgFutureAmount('');
        setLoading(false);
        return;
      }

      const normScenarioId = normalizeScenarioId(scenarioId);
      let rows;
      if (normScenarioId) {
        rows = data.filter(r => r.scenario_id === normScenarioId);
      } else {
        rows = data.filter(r => r.scenario_id === null);
      }
      let row = rows.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];

      if (row) {
        setNextDueDate(row.next_due_date ? row.next_due_date.slice(0, 10) : '');
        setNextDueAmount(row.next_due_amount || '');
        setAvgFutureAmount(row.avg_future_amount || '');
      } else {
        setNextDueDate('');
        setNextDueAmount('');
        setAvgFutureAmount('');
      }
    } catch (err) {
      setMessage('Exception fetching card.');
      setNextDueDate('');
      setNextDueAmount('');
      setAvgFutureAmount('');
    }
    setLoading(false);
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
        next_due_date: nextDueDate,
        next_due_amount: +nextDueAmount,
        avg_future_amount: +avgFutureAmount,
        scenario_id: normScenarioId,
      };

      const { error } = await supabase
        .from('credit_cards')
        .upsert(payload, { onConflict: ['user_id', 'scenario_id'] });

      if (!error) {
        setMessage('Card saved successfully!');
        setTimeout(() => setMessage(''), 3000);
        await fetchCard();
        if (onSave) onSave();
      } else {
        setMessage('Error saving card.');
      }
    } catch (err) {
      setMessage('Unexpected error.');
    }
    setLoading(false);
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>Credit Card</h2>
      {message && <div className={styles.success}>{message}</div>}

      <div className={styles.formGroup}>
        <label>Next Due Date</label>
        <input
          type="date"
          value={nextDueDate}
          onChange={e => setNextDueDate(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className={styles.formGroup}>
        <label>Next Due Amount</label>
        <input
          type="number"
          value={nextDueAmount}
          onChange={e => setNextDueAmount(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className={styles.formGroup}>
        <label>Avg Future Amount</label>
        <input
          type="number"
          value={avgFutureAmount}
          onChange={e => setAvgFutureAmount(e.target.value)}
          disabled={loading}
        />
      </div>

      <button
        className={styles.button}
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Card'}
      </button>
    </div>
  );
}
