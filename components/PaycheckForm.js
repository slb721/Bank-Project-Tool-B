import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

export default function Paychecks({ refresh, triggerRefresh }) {
  const [paychecks, setPaychecks] = useState([]);
  const [form, setForm] = useState({ amount: '', schedule: '', next_date: '' });

  useEffect(() => {
    async function fetchPaychecks() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('paychecks')
        .select('*')
        .eq('user_id', user.id);
      setPaychecks(data || []);
    }

    fetchPaychecks();
  }, [refresh]);

  async function addPaycheck() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('paychecks').insert([{ ...form, user_id: user.id }]);
    setForm({ amount: '', schedule: '', next_date: '' });
    triggerRefresh();
  }

  async function deletePaycheck(id) {
    await supabase.from('paychecks').delete().eq('id', id);
    triggerRefresh();
  }

  return (
    <div className={styles.card}>
      <h3>Paychecks</h3>
      <ul>
        {paychecks.map((p) => (
          <li key={p.id}>
            ${p.amount} — {p.schedule} — Next: {p.next_date}{' '}
            <button onClick={() => deletePaycheck(p.id)}>🗑</button>
          </li>
        ))}
      </ul>
      <input
        type="number"
        placeholder="Amount"
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
      />
      <select
        value={form.schedule}
        onChange={(e) => setForm({ ...form, schedule: e.target.value })}
      >
        <option value="">Schedule</option>
        <option value="weekly">Weekly</option>
        <option value="biweekly">Biweekly</option>
        <option value="bimonthly">Bimonthly</option>
        <option value="monthly">Monthly</option>
      </select>
      <input
        type="date"
        value={form.next_date}
        onChange={(e) => setForm({ ...form, next_date: e.target.value })}
      />
      <button onClick={addPaycheck}>Add</button>
    </div>
  );
}
