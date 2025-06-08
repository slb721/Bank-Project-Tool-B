import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

export default function PaycheckForm({ onSave }) {
  const [amount, setAmount] = useState('');
  const [schedule, setSchedule] = useState('biweekly');
  const [nextDate, setNextDate] = useState('');
  const [items, setItems] = useState([]);
  const [alert, setAlert] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('paychecks')
      .select('*')
      .eq('user_id', user.id);
    setItems(data || []);
  };

  const startEdit = (pc) => {
    setEditingId(pc.id);
    setAmount(pc.amount);
    setSchedule(pc.schedule);
    setNextDate(pc.next_date);
    setAlert('');
  };

  const handleSave = async () => {
    setAlert('');
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      user_id: user.id,
      amount,
      schedule,
      next_date: nextDate,
    };
    if (editingId) payload.id = editingId;

    const { error } = await supabase
      .from('paychecks')
      .upsert(payload, { onConflict: ['id'] });

    if (error) {
      setAlert(error.message);
    } else {
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
    fetchAll(); onSave();
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>Paychecks</h2>

      <div className={styles.formControl}>
        <label>Amount</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>

      <div className={styles.formControl}>
        <label>Schedule</label>
        <select value={schedule} onChange={(e) => setSchedule(e.target.value)}>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Biweekly</option>
          <option value="bimonthly">Bimonthly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div className={styles.formControl}>
        <label>Next Pay Date</label>
        <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
      </div>

      <button className={styles.button} onClick={handleSave}>
        {editingId ? 'Update Paycheck' : 'Save Paycheck'}
      </button>
      {alert && <div className={styles.alert}>{alert}</div>}

      <ul style={{ marginTop: '1rem' }}>
        {items.map((pc) => (
          <li key={pc.id} style={{ marginBottom: '0.75rem' }}>
            ${parseFloat(pc.amount).toFixed(2)} – {pc.schedule} next {pc.next_date}
            <button className={styles.buttonSm} style={{ marginLeft: '0.5rem' }} onClick={() => startEdit(pc)}>Edit</button>
            <button className={styles.buttonSm} style={{ marginLeft: '0.25rem', background: '#ef4444', color: 'white' }} onClick={() => handleDelete(pc.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
