// components/PaycheckForm.js

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

function normalizeScenarioId(scenarioId) {
  return !scenarioId || scenarioId === '' ? '00000000-0000-0000-0000-000000000000' : scenarioId;
}

export default function PaycheckForm({ scenarioId }) {
  const [amount, setAmount] = useState('');
  const [schedule, setSchedule] = useState('biweekly');
  const [nextDate, setNextDate] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [paychecks, setPaychecks] = useState([]);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchPaychecks();
    // eslint-disable-next-line
  }, [scenarioId]);

  const fetchPaychecks = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPaychecks([]);
        setMessage('No user logged in.');
        setLoading(false);
        return;
      }
      const normScenarioId = normalizeScenarioId(scenarioId);
      const { data, error } = await supabase
        .from('paychecks')
        .select('id, user_id, amount, schedule, next_date, scenario_id, updated_at')
        .eq('user_id', user.id)
        .eq('scenario_id', normScenarioId)
        .order('updated_at', { ascending: false });

      if (error) {
        setMessage('Error fetching paychecks: ' + (error.message || JSON.stringify(error)));
        setPaychecks([]);
      } else {
        setPaychecks(data || []);
      }
    } catch (err) {
      setMessage('Exception fetching paychecks.');
      setPaychecks([]);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setEditId(null);
    setAmount('');
    setSchedule('biweekly');
    setNextDate('');
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
      let result;
      if (editId) {
        result = await supabase
          .from('paychecks')
          .update(payload)
          .eq('id', editId);
      } else {
        result = await supabase
          .from('paychecks')
          .insert(payload);
      }

      const { error } = result;
      if (!error) {
        setMessage('Paycheck saved successfully!');
        setTimeout(() => setMessage(''), 3000);
        resetForm();
        await fetchPaychecks();
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

  const handleEdit = (row) => {
    setEditId(row.id);
    setAmount(row.amount);
    setSchedule(row.schedule);
    setNextDate(row.next_date ? row.next_date.slice(0, 10) : '');
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('paychecks').delete().eq('id', id);
      if (!error) {
        setMessage('Deleted successfully');
        setTimeout(() => setMessage(''), 3000);
        resetForm();
        await fetchPaychecks();
      } else {
        setMessage('Error deleting: ' + (error.message || JSON.stringify(error)));
      }
    } finally {
      setLoading(false);
    }
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
        {loading ? 'Saving...' : editId ? 'Update Paycheck' : 'Add Paycheck'}
      </button>
      {editId && (
        <button className={styles.button} onClick={resetForm} disabled={loading} style={{ marginLeft: 8 }}>
          Cancel
        </button>
      )}

      <hr style={{ margin: "24px 0" }} />

      <h3 style={{ marginBottom: 8 }}>Your Paychecks</h3>
      {paychecks.length === 0 ? (
        <div>No paychecks for this scenario.</div>
      ) : (
        <ul>
          {paychecks.map((row) => (
            <li key={row.id} style={{ marginBottom: 8 }}>
              <b>${row.amount}</b> {row.schedule}, Next: {row.next_date ? row.next_date.slice(0, 10) : 'N/A'}
              <button style={{ marginLeft: 8 }} onClick={() => handleEdit(row)} disabled={loading}>Edit</button>
              <button style={{ marginLeft: 4 }} onClick={() => handleDelete(row.id)} disabled={loading}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
