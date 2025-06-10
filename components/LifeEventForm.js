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

export default function LifeEventForm({ onSave, scenarioId, refresh }) {
  const [events, setEvents] = useState([]);
  const [label, setLabel] = useState('');
  const [type, setType] = useState('one_time_outflow');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [recurrence, setRecurrence] = useState('');
  const [relatedPaycheckId, setRelatedPaycheckId] = useState('');
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [paychecks, setPaychecks] = useState([]);

  useEffect(() => { fetchEvents(); fetchPaychecks(); }, [scenarioId, refresh]);

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
      let query = supabase.from('life_events').select('*').eq('user_id', user.id);
      if (normScenarioId === null) {
        query = query.is('scenario_id', null);
      } else {
        query = query.eq('scenario_id', normScenarioId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      setEvents(error ? [] : (data || []));
    } finally {
      setLoading(false);
    }
  };

  const fetchPaychecks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setPaychecks([]);
    const normScenarioId = normalizeScenarioId(scenarioId);
    let query = supabase.from('paychecks').select('*').eq('user_id', user.id);
    if (normScenarioId === null) {
      query = query.is('scenario_id', null);
    } else {
      query = query.eq('scenario_id', normScenarioId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    setPaychecks(error ? [] : (data || []));
  };

  const resetForm = () => {
    setLabel('');
    setType('one_time_outflow');
    setAmount('');
    setStartDate('');
    setEndDate('');
    setRecurrence('');
    setRelatedPaycheckId('');
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
        type,
        label,
        amount: +amount,
        start_date: startDate,
        end_date: endDate || null,
        recurrence,
        related_paycheck_id: type === 'income_loss' ? relatedPaycheckId : null,
      };
      let result;
      if (editId) {
        result = await supabase.from('life_events').update(payload).eq('id', editId);
      } else {
        result = await supabase.from('life_events').insert(payload);
      }
      const { error } = result;
      if (!error) {
        setMessage('Event saved!');
        setTimeout(() => setMessage(''), 1500);
        resetForm();
        fetchEvents();
        if (onSave) onSave();
      } else {
        setMessage('Error saving event: ' + (error.message || JSON.stringify(error)));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (e) => {
    setEditId(e.id);
    setLabel(e.label || '');
    setType(e.type || 'one_time_outflow');
    setAmount(e.amount || '');
    setStartDate(e.start_date ? e.start_date.slice(0, 10) : '');
    setEndDate(e.end_date ? e.end_date.slice(0, 10) : '');
    setRecurrence(e.recurrence || '');
    setRelatedPaycheckId(e.related_paycheck_id || '');
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await supabase.from('life_events').delete().eq('id', id);
      setMessage('Deleted.');
      setTimeout(() => setMessage(''), 1000);
      resetForm();
      fetchEvents();
      if (onSave) onSave();
    } finally {
      setLoading(false);
    }
  };

  const isJobLoss = type === 'income_loss';

  return (
    <div className={styles.card}>
      <h2>Life Events</h2>
      {message && <div className={styles.success}>{message}</div>}

      <div className={styles.formGroup}>
        <label>Label/Description</label>
        <input type="text" value={label} onChange={e => setLabel(e.target.value)} disabled={loading} />
      </div>

      <div className={styles.formGroup}>
        <label>Type</label>
        <select value={type} onChange={e => setType(e.target.value)} disabled={loading}>
          <option value="one_time_outflow">One-Time Expense</option>
          <option value="one_time_inflow">One-Time Cash Increase</option>
          <option value="expense_increase">Expense Increase (recurring)</option>
          <option value="income_increase">Income Increase (recurring)</option>
          <option value="income_loss">Job Loss/Leave (pick income stream)</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>
          Amount
          <span style={{ color: '#888', fontSize: 11, marginLeft: 5 }}>
            ({type.startsWith('income') || type === 'one_time_inflow' ? '+' : '-'} value)
          </span>
        </label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          disabled={loading}
        />
      </div>

      {isJobLoss && (
        <div className={styles.formGroup}>
          <label>Which Income Stream?</label>
          <select value={relatedPaycheckId} onChange={e => setRelatedPaycheckId(e.target.value)} disabled={loading}>
            <option value="">Select</option>
            {paychecks.map(p => (
              <option key={p.id} value={p.id}>
                {p.name || '$' + p.amount + ' – ' + p.schedule}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.formGroup}>
        <label>Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          disabled={loading}
        />
      </div>
      {(type === 'expense_increase' || type === 'income_increase' || isJobLoss) && (
        <div className={styles.formGroup}>
          <label>End Date (leave blank for ongoing)</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            disabled={loading}
          />
        </div>
      )}
      {(type === 'expense_increase' || type === 'income_increase') && (
        <div className={styles.formGroup}>
          <label>Recurrence</label>
          <select value={recurrence} onChange={e => setRecurrence(e.target.value)} disabled={loading}>
            <option value="">Select</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="bimonthly">Bimonthly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      )}

      <button className={styles.button} onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : editId ? 'Update' : 'Add'}
      </button>
      {editId && (
        <button className={styles.button} onClick={resetForm} style={{ marginLeft: 8 }}>
          Cancel
        </button>
      )}
      <hr style={{ margin: "16px 0" }} />
      <h3>Saved Events</h3>
      <ul style={{ paddingLeft: 0 }}>
        {events.length === 0 ? (
          <div>No events saved.</div>
        ) : (
          events.map((e) => (
            <li key={e.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', listStyle: 'none' }}>
              <span>
                <b>{e.label}</b> — {e.type.replace(/_/g, ' ')}
                {e.amount ? ' $' + e.amount : ''}
                {e.related_paycheck_id && paychecks.find(p => p.id === e.related_paycheck_id)
                  ? <> (Income: {paychecks.find(p => p.id === e.related_paycheck_id)?.name || ''})</>
                  : ''}
                <br />
                <small>
                  {e.start_date ? `Start: ${e.start_date.slice(0, 10)}` : ''}
                  {e.end_date ? ` – End: ${e.end_date.slice(0, 10)}` : ''}
                  {e.recurrence ? ` – Every: ${e.recurrence}` : ''}
                </small>
              </span>
              <button
                style={{
                  marginLeft: 12,
                  padding: '2px 10px',
                  fontSize: 13,
                  background: '#e3edfc',
                  color: '#2466a7',
                  border: '1px solid #bdd7f6',
                  borderRadius: 5,
                  cursor: 'pointer',
                  marginRight: 6,
                }}
                onClick={() => handleEdit(e)}
                disabled={loading}
              >Edit</button>
              <button
                style={{
                  padding: '2px 10px',
                  fontSize: 13,
                  background: '#fff7f7',
                  color: '#c0392b',
                  border: '1px solid #c0392b',
                  borderRadius: 5,
                  cursor: 'pointer'
                }}
                onClick={() => handleDelete(e.id)}
                disabled={loading}
              >Delete</button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
