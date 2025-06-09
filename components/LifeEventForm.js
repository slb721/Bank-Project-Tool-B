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
  { value: 'income_loss', label: 'Job/Income Loss', icon: '⛔️' },
];

function normalizeScenarioId(scenarioId) {
  return !scenarioId || scenarioId === '00000000-0000-0000-0000-000000000000' ? null : scenarioId;
}

function getAmountHelpText(type, recurrence, paychecks, selectedLossPaycheckId) {
  switch (type) {
    case 'income':
      return `Enter the ${recurrence} INCREASE in income (positive number).`;
    case 'expense':
      return `Enter the ${recurrence} INCREASE in expenses (positive number).`;
    case 'one_time_inflow':
      return 'Enter the amount received ONCE (positive number).';
    case 'one_time_outflow':
      return 'Enter the amount spent ONCE (positive number).';
    case 'income_loss':
      if (paychecks.length === 0) return 'No income streams found for this scenario.';
      if (!selectedLossPaycheckId) return 'Select which income stream will be lost and pick the start date of loss.';
      const paycheck = paychecks.find(p => p.id === selectedLossPaycheckId);
      return `All income from "${paycheck ? paycheck.name || `$${paycheck.amount}` : 'Selected Paycheck'}" will be removed after the start date. If you set an end date, it will resume after that period.`;
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

  // For job loss event
  const [paychecks, setPaychecks] = useState([]);
  const [lossPaycheckId, setLossPaycheckId] = useState('');

  useEffect(() => {
    fetchEvents();
    fetchPaychecks();
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
      let query = supabase.from('life_events').select('*').eq('user_id', user.id);
      if (normScenarioId === null) {
        query = query.is('scenario_id', null);
      } else {
        query = query.eq('scenario_id', normScenarioId);
      }
      const { data, error } = await query.order('start_date', { ascending: true });
      setEvents(error ? [] : (data || []));
    } finally {
      setLoading(false);
    }
  };

  const fetchPaychecks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setPaychecks([]);
      return;
    }
    const normScenarioId = normalizeScenarioId(scenarioId);
    let query = supabase
      .from('paychecks')
      .select('id, amount, schedule, next_date, name, scenario_id, updated_at')
      .eq('user_id', user.id);
    if (normScenarioId === null) {
      query = query.is('scenario_id', null);
    } else {
      query = query.eq('scenario_id', normScenarioId);
    }
    const { data, error } = await query.order('updated_at', { ascending: false });
    setPaychecks(error ? [] : (data || []));
  };

  const resetForm = () => {
    setEditId(null);
    setLabel('');
    setType('income');
    setAmount('');
    setStartDate('');
    setEndDate('');
    setRecurrence('one_time');
    setLossPaycheckId('');
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

      // For job loss, encode the selected paycheck id
      let payload = {
        user_id: user.id,
        scenario_id: normScenarioId,
        type,
        label: label || (type === 'income_loss' ? 'Job Loss' : '(No Label)'),
        amount: type === 'income_loss' ? 0 : +amount,
        start_date: startDate,
        end_date: recurrence === 'one_time' || !endDate ? null : endDate,
        recurrence: type === 'income_loss'
          ? paychecks.find(p => p.id === lossPaycheckId)?.schedule || 'monthly'
          : recurrence,
        related_paycheck_id: type === 'income_loss' ? lossPaycheckId : null,
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
    setLossPaycheckId(event.related_paycheck_id || '');
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
          onChange={e => {
            setType(e.target.value);
            if (e.target.value === 'income_loss') {
              setAmount('');
              setLossPaycheckId('');
              setRecurrence('');
            }
          }}
          disabled={loading}
        >
          {typeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* For job loss: income stream dropdown, recurrence auto-lock */}
      {type === 'income_loss' ? (
        <>
          <div className={styles.formGroup}>
            <label>Select Income Stream</label>
            <select
              value={lossPaycheckId}
              onChange={e => {
                setLossPaycheckId(e.target.value);
                const p = paychecks.find(p => p.id === e.target.value);
                if (p) setRecurrence(p.schedule);
              }}
              disabled={loading || paychecks.length === 0}
            >
              <option value="">-- Select --</option>
              {paychecks.map(pc => (
                <option key={pc.id} value={pc.id}>
                  {pc.name ? pc.name : ''} {pc.amount ? `$${pc.amount}` : ''} {pc.schedule} (Next: {pc.next_date ? pc.next_date.slice(0, 10) : 'N/A'})
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Recurrence</label>
            <input
              type="text"
              value={paychecks.find(p => p.id === lossPaycheckId)?.schedule || ''}
              readOnly
              style={{ background: '#eee', color: '#666', cursor: 'not-allowed' }}
            />
          </div>
        </>
      ) : (
        <>
          <div className={styles.formGroup}>
            <label>Amount</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              disabled={loading}
              placeholder="Positive number"
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
        </>
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
      {(type !== 'one_time_inflow' && type !== 'one_time_outflow') && (
        <div className={styles.formGroup}>
          <label>
            End Date{' '}
            <span style={{ color: '#999', fontWeight: 'normal' }}>
              (leave blank for permanent change)
            </span>
          </label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            disabled={loading}
          />
        </div>
      )}

      <div style={{ color: '#555', margin: '8px 0', fontSize: 13 }}>
        {getAmountHelpText(type, recurrence, paychecks, lossPaycheckId)}
      </div>
      <button
        className={styles.button}
        onClick={handleSave}
        disabled={
          loading ||
          (type === 'income_loss' && !lossPaycheckId)
        }
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
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th align="left">Type</th>
              <th align="left">Label</th>
              <th align="right">Amount</th>
              <th align="left">Start</th>
              <th align="left">End</th>
              <th align="left">Recurrence</th>
              <th align="center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((row) => (
              <tr key={row.id} style={{ borderBottom: '1px solid #eee', verticalAlign: 'middle' }}>
                <td>{typeIcon(row.type)} {typeLabel(row.type)}</td>
                <td>{row.label}</td>
                <td align="right" style={{ color: (row.type === 'income' || row.type === 'one_time_inflow') ? '#059669' : '#b91c1c', fontWeight: 600 }}>
                  {(row.type === 'income' || row.type === 'one_time_inflow') ? '+' : row.type === 'income_loss' ? '—' : '-'}{row.amount}
                </td>
                <td>{row.start_date ? row.start_date.slice(0, 10) : ''}</td>
                <td>{row.end_date ? row.end_date.slice(0, 10) : (row.recurrence === 'one_time' ? '—' : 'No end')}</td>
                <td>{row.recurrence && row.recurrence.replace('_', ' ')}</td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#333',
                        fontSize: 16,
                        cursor: 'pointer',
                        padding: 0,
                        margin: 0,
                        lineHeight: 1
                      }}
                      title="Edit"
                      onClick={() => handleEdit(row)}
                      disabled={loading}
                    >✏️</button>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#c0392b',
                        fontSize: 16,
                        cursor: 'pointer',
                        padding: 0,
                        margin: 0,
                        lineHeight: 1
                      }}
                      title="Delete"
                      onClick={() => handleDelete(row.id)}
                      disabled={loading}
                    >🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
