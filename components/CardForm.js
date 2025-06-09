// components/CardForm.js

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

function normalizeScenarioId(scenarioId) {
  return !scenarioId || scenarioId === '' ? '00000000-0000-0000-0000-000000000000' : scenarioId;
}

export default function CardForm({ scenarioId }) {
  const [name, setName] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [nextDueAmount, setNextDueAmount] = useState('');
  const [avgFutureAmount, setAvgFutureAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [cards, setCards] = useState([]);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchCards();
    // eslint-disable-next-line
  }, [scenarioId]);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCards([]);
        setMessage('No user logged in.');
        setLoading(false);
        return;
      }
      const normScenarioId = normalizeScenarioId(scenarioId);
      const { data, error } = await supabase
        .from('credit_cards')
        .select('id, user_id, name, next_due_date, next_due_amount, avg_future_amount, scenario_id, updated_at')
        .eq('user_id', user.id)
        .eq('scenario_id', normScenarioId)
        .order('updated_at', { ascending: false });

      if (error) {
        setMessage('Error fetching cards: ' + (error.message || JSON.stringify(error)));
        setCards([]);
      } else {
        setCards(data || []);
      }
    } catch (err) {
      setMessage('Exception fetching cards.');
      setCards([]);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setEditId(null);
    setName('');
    setNextDueDate('');
    setNextDueAmount('');
    setAvgFutureAmount('');
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
        name: name || 'Main Card',
        next_due_date: nextDueDate,
        next_due_amount: +nextDueAmount,
        avg_future_amount: +avgFutureAmount,
        scenario_id: normScenarioId,
      };
      let result;
      if (editId) {
        result = await supabase
          .from('credit_cards')
          .update(payload)
          .eq('id', editId);
      } else {
        result = await supabase
          .from('credit_cards')
          .insert(payload);
      }

      const { error } = result;
      if (!error) {
        setMessage('Card saved successfully!');
        setTimeout(() => setMessage(''), 3000);
        resetForm();
        await fetchCards();
      } else {
        setMessage('Error saving card: ' + (error.message || JSON.stringify(error)));
        console.error('Error saving card:', error);
      }
    } catch (err) {
      setMessage('Unexpected error: ' + (err.message || JSON.stringify(err)));
      console.error('Unexpected error saving card:', err);
    }
    setLoading(false);
  };

  const handleEdit = (row) => {
    setEditId(row.id);
    setName(row.name || '');
    setNextDueDate(row.next_due_date ? row.next_due_date.slice(0, 10) : '');
    setNextDueAmount(row.next_due_amount || '');
    setAvgFutureAmount(row.avg_future_amount || '');
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('credit_cards').delete().eq('id', id);
      if (!error) {
        setMessage('Deleted successfully');
        setTimeout(() => setMessage(''), 3000);
        resetForm();
        await fetchCards();
      } else {
        setMessage('Error deleting: ' + (error.message || JSON.stringify(error)));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>Credit Card</h2>
      {message && <div className={styles.success}>{message}</div>}

      <div className={styles.formGroup}>
        <label>Card Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={loading}
          placeholder="Card name"
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
        {loading ? 'Saving...' : editId ? 'Update Card' : 'Add Card'}
      </button>
      {editId && (
        <button className={styles.button} onClick={resetForm} disabled={loading} style={{ marginLeft: 8 }}>
          Cancel
        </button>
      )}

      <hr style={{ margin: "24px 0" }} />

      <h3 style={{ marginBottom: 8 }}>Your Credit Cards</h3>
      {cards.length === 0 ? (
        <div>No cards for this scenario.</div>
      ) : (
        <ul>
          {cards.map((row) => (
            <li key={row.id} style={{ marginBottom: 8 }}>
              <b>{row.name || 'Card'}</b>: ${row.next_due_amount} (Next: {row.next_due_date ? row.next_due_date.slice(0, 10) : 'N/A'})
              , Avg Future: ${row.avg_future_amount}
              <button style={{ marginLeft: 8 }} onClick={() => handleEdit(row)} disabled={loading}>Edit</button>
              <button style={{ marginLeft: 4 }} onClick={() => handleDelete(row.id)} disabled={loading}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
