// components/PaycheckForm.js

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

function normalizeScenarioId(scenarioId) {
  // Use default UUID for default scenario, not null!
  return !scenarioId || scenarioId === '' ? '00000000-0000-0000-0000-000000000000' : scenarioId;
}

export default function PaycheckForm({ onSave, scenarioId }) {
  const [amount, setAmount] = useState('');
  const [schedule, setSchedule] = useState('biweekly');
  const [nextDate, setNextDate] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPaycheck();
    // eslint-disable-next-line
  }, [scenarioId]);

  const fetchPaycheck = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAmount('');
        setMessage('No user logged in.');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('paychecks')
        .select('id, user_id, amount, schedule, next_date, scenario_id, updated_at')
        .eq('user_id', user.id);

      if (error) {
        setMessage('Error fetching paycheck: ' + (error.message || JSON.stringify(error)));
        setAmount('');
        setSchedule('biweekly');
        setNextDate('');
        setLoading(false);
        return;
      }

      const normScenarioId = normalizeScenarioId(scenarioId);
      let rows = data.filter(r => r.scenario_id === normScenarioId);
      let row = rows.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))[0];

      if (row) {
        setAmount(row.amount);
        setSchedule(row.schedule);
        setNextDate(row.next_date ? row.next_date.slice(0, 10) : '');
      } else {
        setAmount('');
        setSchedule('biweekly');
        setNextDate('');
      }
    } catch (err) {
      setMessage('Exception fetching paycheck.');
      setAmount('');
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
        amount: +amount,
        schedule,
        next_date: nextDate,
        scenario_id: normScenarioId,
      };

      const { error } = await supabase
        .from('paychecks')
        .upsert(payload, { onConflict: ['user_id', 'scenario_id'] });

      if (!error) {
        setMessage('Paycheck saved successfully!');
        setTimeout(() => setMessage(''), 3000);
        await fetchPaycheck();
        if (onSave) onSave();
      } else {
        setMessage('Error saving paycheck: ' + (error.message || JSON.stringify(error)));
        console.error('Error saving paycheck:', error);
      }
    } catch (err) {
      setMessage('Unexpected error: ' + (err.message || JSON.stringify(err)));
      console.error('Unexpected error saving paycheck:', err);
    }
    setLoading(false);
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>Paycheck</h2>
      {message && <div className={styles.success}>{message}</div>}

      <div className={styles.formGroup}>
        <label>Amount</label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className={styles.formGroup}>
        <label>Schedule</label>
        <select
          value={schedule}
          onChange={e => setSchedule(e.target.value)}
          disabled={loading}
        >
          <option value="weekly">Weekly</option>
          <option value="biweekly">Biweekly</option>
          <option value="bimonthly">Bimonthly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <div className={styles.formGroup}>
        <label>Next Date</label>
        <input
          type="date"
          value={nextDate}
          onChange={e => setNextDate(e.target.value)}
          disabled={loading}
        />
      </div>

      <button
        className={styles.button}
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Paycheck'}
      </button>
    </div>
  );
}
