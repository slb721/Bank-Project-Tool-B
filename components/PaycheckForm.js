import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';
import { toast } from 'react-hot-toast';

export default function PaycheckForm({ onSave }) {
  const [amount, setAmount] = useState('');
  const [schedule, setSchedule] = useState('biweekly');
  const [nextDate, setNextDate] = useState('');
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
  };

  const handleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
      toast.error(error.message);
    } else {
      setAmount('');
      setSchedule('biweekly');
      setNextDate('');
      setEditingId(null);
      toast.success('Paycheck saved!');
      fetchAll();
      onSave();
    }
  };

  const handleDelete = async (id) => {
    await supabase.from('paychecks').delete().eq('id', id);
    toast.success('Deleted');
    fetchAll();
    onSave();
  };

  return (
    <div className={styles.card}>
      <h2>Paychecks</h2>
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
    </div>
  );
}
