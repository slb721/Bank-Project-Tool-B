// components/CardForm.js

import { useState, useEffect } from 'react';
import { supabase, TEST_USER_ID } from '../lib/supabaseClient';

export default function CardForm({ onSave }) {
  const [name, setName] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [nextDueAmount, setNextDueAmount] = useState('');
  const [avgFuture, setAvgFuture] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [cards, setCards] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    const { data, error } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', TEST_USER_ID);
    if (error) {
      console.error('Error fetching cards:', error.message);
    } else {
      setCards(data);
    }
  };

  const startEdit = (card) => {
    setEditingId(card.id);
    setName(card.name);
    setNextDueDate(card.next_due_date);
    setNextDueAmount(card.next_due_amount);
    setAvgFuture(card.avg_future_amount);
    setMessage('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setNextDueDate('');
    setNextDueAmount('');
    setAvgFuture('');
    setMessage('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    await supabase
      .from('profiles')
      .upsert({ id: TEST_USER_ID, email: 'test@example.com' });

    if (editingId) {
      // Update existing
      const { error } = await supabase
        .from('credit_cards')
        .update({
          name,
          next_due_date: nextDueDate,
          next_due_amount: nextDueAmount,
          avg_future_amount: avgFuture,
        })
        .eq('id', editingId);

      setLoading(false);
      if (error) {
        console.error('Error updating card:', error.message);
        setMessage('Error: ' + error.message);
      } else {
        setMessage('Card updated.');
        cancelEdit();
        fetchCards();
        onSave();
      }
    } else {
      // Insert new
      const { error } = await supabase.from('credit_cards').insert([
        {
          user_id: TEST_USER_ID,
          name,
          next_due_date: nextDueDate,
          next_due_amount: nextDueAmount,
          avg_future_amount: avgFuture,
        },
      ]);
      setLoading(false);
      if (error) {
        console.error('Error saving card:', error.message);
        setMessage('Error: ' + error.message);
      } else {
        setMessage('Card saved.');
        setName('');
        setNextDueDate('');
        setNextDueAmount('');
        setAvgFuture('');
        fetchCards();
        onSave();
      }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this card?')) return;
    const { error } = await supabase
      .from('credit_cards')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting card:', error.message);
    } else {
      fetchCards();
      onSave();
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <form onSubmit={handleSave} style={{ marginBottom: 12 }}>
        <label>
          Card Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ display: 'block', width: '100%', marginBottom: 8 }}
          />
        </label>

        <label>
          Next Due Date
          <input
            type="date"
            value={nextDueDate}
            onChange={(e) => setNextDueDate(e.target.value)}
            required
            style={{ display: 'block', width: '100%', marginBottom: 8 }}
          />
        </label>

        <label>
          Next Due Amount
          <input
            type="number"
            step="0.01"
            value={nextDueAmount}
            onChange={(e) => setNextDueAmount(e.target.value)}
            required
            style={{ display: 'block', width: '100%', marginBottom: 8 }}
          />
        </label>

        <label>
          Avg Future Amount
          <input
            type="number"
            step="0.01"
            value={avgFuture}
            onChange={(e) => setAvgFuture(e.target.value)}
            required
            style={{ display: 'block', width: '100%', marginBottom: 12 }}
          />
        </label>

        <button type="submit" style={{ width: '100%' }} disabled={loading}>
          {loading
            ? editingId
              ? 'Updating…'
              : 'Saving…'
            : editingId
            ? 'Update Card'
            : 'Save Card'}
        </button>
        {message && <p style={{ marginTop: 8 }}>{message}</p>}
        {editingId && (
          <button type="button" onClick={cancelEdit} style={{ marginTop: 8 }}>
            Cancel Edit
          </button>
        )}
      </form>

      <h4>Your Cards:</h4>
      {cards.length === 0 ? (
        <p>No cards yet.</p>
      ) : (
        <ul>
          {cards.map((c) => (
            <li key={c.id} style={{ marginBottom: 4 }}>
              <strong>{c.name}</strong> — Due {c.next_due_date} ($
              {c.next_due_amount}), Avg ${c.avg_future_amount}{' '}
              <button
                onClick={() => startEdit(c)}
                style={{ marginLeft: 8, fontSize: '0.8em' }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                style={{ marginLeft: 4, fontSize: '0.8em', color: 'red' }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
