import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';
import { toast } from 'react-hot-toast';

export default function CardForm({ onSave }) {
  const [name, setName] = useState('');
  const [nextDue, setNextDue] = useState('');
  const [nextAmt, setNextAmt] = useState('');
  const [avgAmt, setAvgAmt] = useState('');
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
  };

  const handleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      user_id: user.id,
      name,
      next_due_date: nextDue,
      next_due_amount: nextAmt,
      avg_future_amount: avgAmt,
    };
    if (editingId) payload.id = editingId;

    const { error } = await supabase
      .from('credit_cards')
      .upsert(payload, { onConflict: ['id'] });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Card saved!');
      setName('');
      setNextDue('');
      setNextAmt('');
      setAvgAmt('');
      setEditingId(null);
      fetchAll();
      onSave();
    }
  };

  const handleDelete = async (id) => {
    await supabase.from('credit_cards').delete().eq('id', id);
    toast.success('Deleted');
    fetchAll();
    onSave();
  };

  return (
    <div className={styles.card}>
      <h2>Credit Cards</h2>
      <ul className={styles.itemList}>
        {items.map((cc) => (
          <li key={cc.id} className={styles.listItem}>
            <div className={styles.itemInfo}>
              {cc.name || 'Card'} — Due {cc.next_due_date} — ${parseFloat(cc.next_due_amount).toFixed(2)} — Avg ${parseFloat(cc.avg_future_amount).toFixed(2)}
            </div>
            <div className={styles.itemActions}>
              <button className={styles.buttonSm} onClick={() => startEdit(cc)}>Edit</button>
              <button className={`${styles.buttonSm} ${styles.buttonDanger}`} onClick={() => handleDelete(cc.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>

      <div className={styles.formGroup}>
        <label>Card Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className={styles.formGroup}>
        <label>Next Due Date</label>
        <input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
      </div>
      <div className={styles.formGroup}>
        <label>Next Due Amount</label>
        <input type="number" value={nextAmt} onChange={(e) => setNextAmt(e.target.value)} />
      </div>
      <div className={styles.formGroup}>
        <label>Avg Future Amount</label>
        <input type="number" value={avgAmt} onChange={(e) => setAvgAmt(e.target.value)} />
      </div>

      <button className={styles.button} onClick={handleSave}>
        {editingId ? 'Update' : 'Add'} Card
      </button>
    </div>
  );
}
