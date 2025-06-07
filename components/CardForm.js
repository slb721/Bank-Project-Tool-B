import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

export default function CreditCards({ refresh, triggerRefresh }) {
  const [cards, setCards] = useState([]);
  const [form, setForm] = useState({
    next_due_date: '',
    next_due_amount: '',
    avg_future_amount: '',
  });

  useEffect(() => {
    async function fetchCards() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', user.id);
      setCards(data || []);
    }

    fetchCards();
  }, [refresh]);

  async function addCard() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('credit_cards').insert([{ ...form, user_id: user.id }]);
    setForm({ next_due_date: '', next_due_amount: '', avg_future_amount: '' });
    triggerRefresh();
  }

  async function deleteCard(id) {
    await supabase.from('credit_cards').delete().eq('id', id);
    triggerRefresh();
  }

  return (
    <div className={styles.card}>
      <h3>Credit Cards</h3>
      <ul>
        {cards.map((c) => (
          <li key={c.id}>
            Due {c.next_due_date} — ${c.next_due_amount} — Avg ${c.avg_future_amount}{' '}
            <button onClick={() => deleteCard(c.id)}>🗑</button>
          </li>
        ))}
      </ul>
      <input
        type="date"
        value={form.next_due_date}
        onChange={(e) => setForm({ ...form, next_due_date: e.target.value })}
      />
      <input
        type="number"
        placeholder="Next Due"
        value={form.next_due_amount}
        onChange={(e) => setForm({ ...form, next_due_amount: e.target.value })}
      />
      <input
        type="number"
        placeholder="Avg Future"
        value={form.avg_future_amount}
        onChange={(e) => setForm({ ...form, avg_future_amount: e.target.value })}
      />
      <button onClick={addCard}>Add</button>
    </div>
  );
}
