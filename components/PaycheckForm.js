// components/PaycheckForm.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

export default function PaycheckForm({ onSave, scenarioId }) {
  const [amount, setAmount] = useState('');
  const [schedule, setSchedule] = useState('biweekly');
  const [nextDate, setNextDate] = useState('');
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, [scenarioId]);

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const query = supabase
      .from('paychecks')
      .select('*')
      .eq('user_id', user.id);

    if (scenarioId) query.eq('scenario_id', scenarioId);
    else query.is('scenario_id', null);

    const { data, error } = await query.order('next_date', { ascending: true });
    if (data) setItems(data);
    else setItems([]);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setAmount(item.amount);
    setSchedule(item.schedule);
    setNextDate(item.next_date);
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      amount: +amount,
      schedule,
      next_date: nextDate,
      user_id: user.id,
      scenario_id: scenarioId || null,
    };
    if (editingId) payload.id = editingId;

    const { error } = await supabase.from('paychecks').upsert(payload);
    if (!error) {
      setMessage('Paycheck saved successfully!');
      setTimeout(() => setMessage(''), 3000);
      setAmount('');
      setSchedule('biweekly');
      setNextDate('');
      setEditingId(null);
      fetchAll();
      onSave();
    }
  };

  const handleDelete = async (id) => {
    await supabase.from('paychecks').delete().eq('id', id);
    setMessage('Paycheck deleted.');
    setTimeout(() => setMessage(''), 3000);
    fetchAll();
    onSave();
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>Paychecks</h2>
      {message && <div className={styles.success}>{message}</div>}
      <div className={styles.formGroup}>
        <label>Amount</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className={styles.formGroup}>
        <label>Schedule</label>
        <select value={schedule} onChange={(e) => setSchedule(e.target.value)}>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Biweekly</option>
          <option value="bimonthly">Bimonthly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <div className={styles.formGroup}>
        <label>Next Date</label>
        <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
      </div>
      <button className={styles.button} onClick={handleSave}>
        {editingId ? 'Update' : 'Add'} Paycheck
      </button>
      <ul className={styles.itemList}>
        {items.map((pc) => (
          <li key={pc.id} className={styles.listItem}>
            <div className={styles.itemInfo}>
              ${parseFloat(pc.amount).toFixed(2)} — {pc.schedule} — Next: {pc.next_date}
            </div>
            <div className={styles.itemActions}>
              <button className={styles.buttonSm} onClick={() => startEdit(pc)}>Edit</button>
              <button className={`${styles.buttonSm} ${styles.buttonDanger}`} onClick={() => handleDelete(pc.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
