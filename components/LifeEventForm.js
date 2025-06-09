import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

const recurrenceOptions = [
  { value: 'one_time', label: 'One-Time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
];

const typeOptions = [
  { value: 'income', label: 'Income Increase', icon: '⬆️' },
  { value: 'expense', label: 'Expense Increase', icon: '⬇️' },
  { value: 'one_time_inflow', label: 'One-Time Inflow', icon: '💰' },
  { value: 'one_time_outflow', label: 'One-Time Outflow', icon: '💸' },
  { value: 'income_loss', label: 'Income Loss (Unemployment/Leave)', icon: '⛔️' },
];

function normalizeScenarioId(scenarioId) {
  return !scenarioId || scenarioId === '' ? '00000000-0000-0000-0000-000000000000' : scenarioId;
}

function getAmountHelpText(type) {
  switch (type) {
    case 'income':
      return 'Enter the monthly INCREASE in income (e.g., new job or raise). Enter as a positive number.';
    case 'expense':
      return 'Enter the monthly INCREASE in expenses (e.g., new recurring bill). Enter as a positive number.';
    case 'one_time_inflow':
      return 'Enter the amount received ONCE (e.g., tax refund). Enter as a positive number.';
    case 'one_time_outflow':
      return 'Enter the amount spent ONCE (e.g., car repair). Enter as a positive number.';
    case 'income_loss':
      return 'Enter the monthly LOSS of income (e.g., job loss or parental leave). Enter as a positive number.';
    default:
      return '';
  }
}

function typeLabel(type) {
  const opt = typeOptions.find(o => o.value === type);
  return opt ? opt.label : type;
}

function typeIcon(type) {
  const opt = typeOptions.find(o => o.value === type);
  return opt ? opt.icon : '';
}

export default function LifeEventForm({ onSave, scenarioId, refresh }) {
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
  }, [scenarioId, refresh]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setEvents([]);
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
      setEvents(error ? [] : (data || []));
    } finally {
      setLoading(false);
    }
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
        end_date: recurrence === 'one_time' || !endDate ? null : endDate,
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
        if (onSave) onSave();
      } else {
        setMessage('Error saving event: ' + (error.message || JSON.stringify(error)));
      }
    } finally {
      setLoading(false);
    }
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
        if (onSave) onSave();
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
          placeholder="E.g., New job, parental leave, tax refund, etc."
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
          placeholder="Positive number"
        />
        <small style={{ color: '#555', display: 'block', marginTop: 2 }}>
          {getAmountHelpText(type)}
        </small>
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
          <label>End Date <span style={{ color: '#999', fontWeight: 'normal' }}>(leave blank for permanent change)</span></label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            disabled={loading}
          />
        </div>
      )}

      <button className={styles.button} onClick={handleSave} disabled={loading}>
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
        <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th align="left">Type</th>
              <th align="left">Label</th>
              <th align="right">Amount</th>
              <th align="left">Start</th>
              <th align="left">End</th>
              <th align="left">Recurrence</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {events.map((row) => (
              <tr key={row.id} style={{ borderBottom: '1px solid #eee', verticalAlign: 'middle' }}>
                <td>{typeIcon(row.type)} {typeLabel(row.type)}</td>
                <td>{row.label}</td>
                <td align="right" style={{ color: (row.type === 'income' || row.type === 'one_time_inflow') ? '#059669' : '#b91c1c', fontWeight: 600 }}>
                  {(row.type === 'income' || row.type === 'one_time_inflow') ? '+' : '-'}${row.amount}
                </td>
                <td>{row.start_date ? row.start_date.slice(0, 10) : ''}</td>
                <td>{row.end_date ? row.end_date.slice(0, 10) : (row.recurrence === 'one_time' ? '—' : 'No end')}</td>
                <td>{row.recurrence.replace('_', ' ')}</td>
                <td>
                  <button className={styles.button} style={{ marginLeft: 0, marginRight: 4 }} onClick={() => handleEdit(row)} disabled={loading}>Edit</button>
                  <button className={styles.button} style={{ backgroundColor: '#ef4444', color: 'white' }} onClick={() => handleDelete(row.id)} disabled={loading}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
