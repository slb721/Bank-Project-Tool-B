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

export default function CardForm({ onSave, scenarioId, refresh }) {
  const [cards, setCards] = useState([]);
  const [name, setName] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [nextDueAmount, setNextDueAmount] = useState('');
  const [avgFutureAmount, setAvgFutureAmount] = useState('');
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchCards(); }, [scenarioId, refresh]);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCards([]);
        setLoading(false);
        return;
      }
      const normScenarioId = normalizeScenarioId(scenarioId);
      let query = supabase.from('credit_cards').select('*').eq('user_id', user.id);
      if (normScenarioId === null) {
        query = query.is('scenario_id', null);
      } else {
        query = query.eq('scenario_id', normScenarioId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      setCards(error ? [] : (data || []));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setNextDueDate('');
    setNextDueAmount('');
    setAvgFutureAmount('');
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
        name,
        next_due_date: nextDueDate,
        next_due_amount: +nextDueAmount,
        avg_future_amount: +avgFutureAmount,
      };
      let result;
      if (editId) {
        result = await supabase.from('credit_cards').update(payload).eq('id', editId);
      } else {
        result = await supabase.from('credit_cards').insert(payload);
      }
      const { error } = result;
      if (!error) {
        setMessage('Card saved!');
        setTimeout(() => setMessage(''), 1500);
        resetForm();
        fetchCards();
        if (onSave) onSave();
      } else {
        setMessage('Error saving card: ' + (error.message || JSON.stringify(error)));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (c) => {
    setEditId(c.id);
    setName(c.name || '');
    setNextDueDate(c.next_due_date ? c.next_due_date.slice(0, 10) : '');
    setNextDueAmount(c.next_due_amount || '');
    setAvgFutureAmount(c.avg_future_amount || '');
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await supabase.from('credit_cards').delete().eq('id', id);
      setMessage('Deleted.');
      setTimeout(() => setMessage(''), 1000);
      resetForm();
      fetchCards();
      if (onSave) onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2>Credit Cards</h2>
      {message && <div className={styles.success}>{message}</div>}
      <div className={styles.formGroup}>
        <label>Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={loading}
        />
      </div>
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
        <label>Average Future Amount</label>
        <input
          type="number"
          value={avgFutureAmount}
          onChange={e => setAvgFutureAmount(e.target.value)}
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
      <h3>Saved Credit Cards</h3>
      <ul style={{ paddingLeft: 0 }}>
        {cards.length === 0 ? (
          <div>No cards saved.</div>
        ) : (
          cards.map((c) => (
            <li key={c.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', listStyle: 'none' }}>
              <span>
                {c.name ? `${c.name} - ` : ''}
                Next: {c.next_due_date ? c.next_due_date.slice(0, 10) : ''} – Due: ${c.next_due_amount} – Avg: ${c.avg_future_amount}
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
                onClick={() => handleEdit(c)}
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
                onClick={() => handleDelete(c.id)}
                disabled={loading}
              >Delete</button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
