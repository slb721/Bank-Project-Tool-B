// components/PaycheckForm.js

import { useState, useEffect } from 'react';
import { supabase, TEST_USER_ID } from '../lib/supabaseClient';

export default function PaycheckForm({ onSave }) {
  const [amount, setAmount] = useState('');
  const [schedule, setSchedule] = useState('biweekly');
  const [nextDate, setNextDate] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [paychecks, setPaychecks] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchPaychecks();
  }, []);

  const fetchPaychecks = async () => {
    const { data, error } = await supabase
      .from('paychecks')
      .select('*')
      .eq('user_id', TEST_USER_ID);
    if (error) console.error('Error fetching paychecks:', error.message);
    else setPaychecks(data);
  };

  const startEdit = (pc) => {
    setEditingId(pc.id);
    setAmount(pc.amount);
    setSchedule(pc.schedule);
    setNextDate(pc.next_date);
    setMessage('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setSchedule('biweekly');
    setNextDate('');
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
      const { error } = await supabase
        .from('paychecks')
        .update({
          amount,
          schedule,
          next_date: nextDate,
        })
        .eq('id', editingId);
      setLoading(false);
      if (error) {
        console.error('Error updating paycheck:', error.message);
        setMessage('Error: ' + error.message);
      } else {
        setMessage('Paycheck updated.');
        cancelEdit();
        fetchPaychecks();
        onSave();
      }
    } else {
      const { error } = await supabase.from('paychecks').insert([
        {
          user_id: TEST_USER_ID,
          amount,
          schedule,
          next_date: nextDate,
        },
      ]);
      setLoading(false);
      if (error) {
        console.error('Error saving paycheck:', error.message);
        setMessage('Error: ' + error.message);
      } else {
        setMessage('Paycheck saved.');
        setAmount('');
        setSchedule('biweekly');
        setNextDate('');
        fetchPaychecks();
        onSave();
      }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this paycheck?')) return;
    const { error } = await supabase.from('paychecks').delete().eq('id', id);
    if (error) {
      console.error('Error deleting paycheck:', error.message);
    } else {
      fetchPaychecks();
      onSave();
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <form onSubmit={handleSave} style={{ marginBottom: 12 }}>
        <label>
          Paycheck Amount
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            style={{ display: 'block', width: '100%', marginBottom: 8 }}
          />
        </label>

        <label>
          Schedule
          <select
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            style={{ display: 'block', width: '100%', marginBottom: 8 }}
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>

        <label>
          Next Pay Date
          <input
            type="date"
            value={nextDate}
            onChange={(e) => setNextDate(e.target.value)}
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
            ? 'Update Paycheck'
            : 'Save Paycheck'}
        </button>
        {message && <p style={{ marginTop: 8 }}>{message}</p>}
        {editingId && (
          <button
            type="button"
            onClick={cancelEdit}
            style={{ marginTop: 8 }}
          >
            Cancel Edit
          </button>
        )}
      </form>

      <h4>Your Paychecks:</h4>
      {paychecks.length === 0 ? (
        <p>No paychecks added yet.</p>
      ) : (
        <ul>
          {paychecks.map((pc) => (
            <li key={pc.id} style={{ marginBottom: 4 }}>
              <strong>${parseFloat(pc.amount).toFixed(2)}</strong> — {pc.schedule}{' '}
              (Next: {pc.next_date}){' '}
              <button
                onClick={() => startEdit(pc)}
                style={{ marginLeft: 8, fontSize: '0.8em' }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(pc.id)}
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
