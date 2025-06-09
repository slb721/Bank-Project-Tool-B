import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

const recurrenceOptions = [
  { value: 'one_time', label: 'One-Time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  // { value: 'custom', label: 'Custom' }, // Enable if you add custom intervals
];

const typeOptions = [
  { value: 'income', label: 'Income Increase' },
  { value: 'expense', label: 'Expense Increase' },
  { value: 'one_time_inflow', label: 'One-Time Inflow' },
  { value: 'one_time_outflow', label: 'One-Time Outflow' }
];

function normalizeScenarioId(scenarioId) {
  return !scenarioId || scenarioId === '' ? '00000000-0000-0000-0000-000000000000' : scenarioId;
}

export default function LifeEventForm({ scenarioId }) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [recurrence, setRecurrence] = useState('one_time');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [events, setEvents] = useState([]);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line
  }, [scenarioId]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setEvents([]);
        setMessage('No user logged in.');
        setLoading(false);
        return;
      }
      const normScenarioId = normalizeScenarioId(scenarioId);
      const { data, error } = await supabase
        .from('life_events')
        .select('*')
        .eq('user_id', user.id)
        .eq('scenario_id', normScenarioId)
        .order('start_date', { ascending: true });

      if (error) {
        setMessage('Error fetching events: ' + (error.message || JSON.stringify(error)));
        setEvents([]);
      } else {
        setEvents(data || []);
      }
    } catch (err) {
      setMessage('Exception fetching events.');
      setEvents([]);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setEditId(null);
    setLabel('');
    setType('income');
    setAmount('');
    setStartDate('');
    setEndDate('');
    setRecurrence('one_time');
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
        type,
        label: label || '(No Label)',
        amount: +amount,
        start_date: startDate,
        end_date: recurrence === 'one_time' ? null : endDate,
        recurrence
      };

      let result;
      if (editId) {
        result = await supabase
          .from('life_events')
          .update(payload)
          .eq('id', editId);
      } else {
        result = await supabase
          .from('life_events')
          .insert(payload);
      }
      const { error } = result;
      if (!error) {
        setMessage('Life event saved!');
        setTimeout(() => setMessage(''), 2000);
        resetForm();
        await fetchEvents();
      } else {
        setMessage('Error saving event: ' + (error.message || JSON.stringify(error)));
      }
    } catch (err) {
      setMessage('Unexpected error: ' + (err.message || JSON.stringify(err)));
    }
    setLoading(false);
  };

  const handleEdit = (event) => {
    setEditId(event.id);
    setLabel(event.label || '');
    setType(event.type);
    setAmount(event.amount || '');
    setStartDate(event.start_date ? event.start_date.slice(0, 10) : '');
    setEndDate(event.end_date ? event.end_date.slice(0, 10) : '');
    setRecurrence(event.recurrence);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('life_events').delete().eq('id', id);
      if (!error) {
        setMessage('Deleted successfully');
        setTimeout(() => setMessage(''), 2000);
        resetForm();
        await fetchEvents();
      } else {
        setMessage('Error deleting: ' + (error.message || JSON.stringify(error)));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>Life Events</h2>
      {message && <div className={styles.success}>{message}</div>}

      <div className={styles.formGroup}>
        <label>Event Label</label>
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="E.g., New job, new car, tax refund, etc."
          disabled={loading}
        />
      </div>
      <div className={styles.formGroup}>
        <label>Type</label>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          disabled={loading}
        >
          {typeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className={styles.formGroup}>
        <label>Amount</label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          disabled={loading}
          placeholder="Amount (e.g. 100, -250)"
        />
      </div>
      <div className={styles.formGroup}>
        <label>Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className={styles.formGroup}>
        <label>Recurrence</label>
        <select
          value={recurrence}
          onChange={e => setRecurrence(e.target.value)}
          disabled={loading}
        >
          {recurrenceOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {recurrence !== 'one_time' && (
        <div className={styles.formGroup}>
          <label>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            disabled={loading}
          />
        </div>
      )}

      <button
        className={styles.button}
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? 'Saving...' : editId ? 'Update Event' : 'Add Event'}
      </button>
      {editId && (
        <button className={styles.button} onClick={resetForm} disabled={loading} style={{ marginLeft: 8 }}>
          Cancel
        </button>
      )}

      <hr style={{ margin: "24px 0" }} />

      <h3 style={{ marginBottom: 8 }}>Events for this Scenario</h3>
      {events.length === 0 ? (
        <div>No events yet.</div>
      ) : (
        <ul>
          {events.map((row) => (
            <li key={row.id} style={{ marginBottom: 8 }}>
              <b>{row.label}</b> ({typeOptions.find(o => o.value === row.type)?.label || row.type})
              : <span>{row.amount > 0 ? '+' : ''}{row.amount}</span>
              {' | '}
              {row.recurrence.replace('_', ' ')} {row.start_date ? `from ${row.start_date.slice(0,10)}` : ''}
              {row.end_date && ` to ${row.end_date.slice(0,10)}`}
              <button style={{ marginLeft: 8 }} onClick={() => handleEdit(row)} disabled={loading}>Edit</button>
              <button style={{ marginLeft: 4 }} onClick={() => handleDelete(row.id)} disabled={loading}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
