import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

function normalizeScenarioId(scenarioId) {
  return !scenarioId || scenarioId === '00000000-0000-0000-0000-000000000000' ? null : scenarioId;
}

export default function PaycheckForm({ onSave, scenarioId, refresh }) {
  const [paychecks, setPaychecks] = useState([]);
  const [amount, setAmount] = useState('');
  const [schedule, setSchedule] = useState('biweekly');
  const [nextDate, setNextDate] = useState('');
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPaychecks();
    // eslint-disable-next-line
  }, [scenarioId, refresh]);

  const fetchPaychecks = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPaychecks([]);
        setLoading(false);
        return;
      }
      const normScenarioId = normalizeScenarioId(scenarioId);
      let query = supabase.from('paychecks').select('*').eq('user_id', user.id);
      if (normScenarioId === null) {
        query = query.is('scenario_id', null);
      } else {
        query = query.eq('scenario_id', normScenarioId);
      }
      const { data, error } = await query.order('updated_at', { ascending: false });
      setPaychecks(error ? [] : (data || []));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setSchedule('biweekly');
    setNextDate('');
    setEditId(null);
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
        amount: +amount,
        schedule,
        next_date: nextDate,
      };
      let result;
      if (editId) {
        result = await supabase.from('paychecks').update(payload).eq('id', editId);
      } else {
        result = await supabase.from('paychecks').insert(payload);
      }
      const { error } = result;
      if (!error) {
        setMessage('Paycheck saved!');
        setTimeout(() => setMessage(''), 1500);
        resetForm();
        fetchPaychecks();
        if (onSave) onSave();
      } else {
        setMessage('Error saving paycheck: ' + (error.message || JSON.stringify(error)));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setAmount(p.amount || '');
    setSchedule(p.schedule || 'biweekly');
    setNextDate(p.next_date ? p.next_date.slice(0, 10) : '');
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await supabase.from('paychecks').delete().eq('id', id);
      setMessage('Deleted.');
      setTimeout(() => setMessage(''), 1000);
      resetForm();
      fetchPaychecks();
      if (onSave) onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2>Paychecks</h2>
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
        <select value={schedule} onChange={e => setSchedule(e.target.value)} disabled={loading}>
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
      <button className={styles.button} onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : editId ? 'Update' : 'Add'}
      </button>
      {editId && (
        <button className={styles.button} onClick={resetForm} style={{ marginLeft: 8 }}>
          Cancel
        </button>
      )}
      <hr style={{ margin: "16px 0" }} />
      <h3>Saved Paychecks</h3>
      {paychecks.length === 0 ? (
        <div>No paychecks saved.</div>
      ) : (
        <ul>
          {paychecks.map(p => (
            <li key={p.id}>
              ${p.amount} - {p.schedule} - Next: {p.next_date ? p.next_date.slice(0, 10) : ''}
              <button style={{ marginLeft: 8 }} onClick={() => handleEdit(p)} disabled={loading}>✏️</button>
              <button style={{ marginLeft: 4 }} onClick={() => handleDelete(p.id)} disabled={loading}>🗑️</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
