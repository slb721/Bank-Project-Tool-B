import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

export default function CardForm({ onSave }) {
  const [name, setName] = useState('');
  const [nextDue, setNextDue] = useState('');
  const [nextAmt, setNextAmt] = useState('');
  const [avgAmt, setAvgAmt] = useState('');
  const [items, setItems] = useState([]);
  const [alert, setAlert] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', user.id);
    setItems(data || []);
  };

  const startEdit = (cc) => {
    setEditingId(cc.id);
    setName(cc.name);
    setNextDue(cc.next_due_date);
    setNextAmt(cc.next_due_amount);
    setAvgAmt(cc.avg_future_amount);
    setAlert('');
  };

  const handleSave = async () => {
    setAlert('');
    if (!name.trim()) return setAlert('Please enter a card name.');

    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      user_id: user.id,
      name: name.trim(),
      next_due_date: nextDue,
      next_due_amount: nextAmt,
      avg_future_amount: avgAmt,
    };
    if (editingId) payload.id = editingId;

    const { error } = await supabase
      .from('credit_cards')
      .upsert(payload, { onConflict: ['id'] });

    if (error) setAlert(error.message);
    else {
      setName(''); setNextDue(''); setNextAmt(''); setAvgAmt(''); setEditingId(null);
      fetchAll(); onSave();
    }
  };

  const handleDelete = async (id) => {
    await supabase.from('credit_cards').delete().eq('id', id);
    fetchAll(); onSave();
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>Credit Cards</h2>

      <div className={styles.formControl}>
        <label>Card Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Visa ending 1234" />
      </div>

      <div className={styles.formControl}>
        <label>Next Due Date</label>
        <input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
      </div>

      <div className={styles.formControl}>
        <label>Next Due Amount</label>
        <input type="number" value={nextAmt} onChange={(e) => setNextAmt(e.target.value)} />
      </div>

      <div className={styles.formControl}>
        <label>Avg Future Amount</label>
        <input type="number" value={avgAmt} onChange={(e) => setAvgAmt(e.target.value)} />
      </div>

      <button className={styles.button} onClick={handleSave}>
        {editingId ? 'Update Card' : 'Save Card'}
      </button>
      {alert && <div className={styles.alert}>{alert}</div>}

      <ul style={{ marginTop: '1rem' }}>
        {items.map((cc) => (
          <li key={cc.id} style={{ marginBottom: '0.75rem' }}>
            <strong>{cc.name}</strong> — Next {cc.next_due_date}: $
            {parseFloat(cc.next_due_amount).toFixed(2)}; Avg $
            {parseFloat(cc.avg_future_amount).toFixed(2)}
            <button className={styles.buttonSm} style={{ marginLeft: '0.5rem' }} onClick={() => startEdit(cc)}>Edit</button>
            <button className={styles.buttonSm} style={{ marginLeft: '0.25rem', background: '#ef4444', color: 'white' }} onClick={() => handleDelete(cc.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
