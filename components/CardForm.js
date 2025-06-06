import { useState, useEffect } from 'react';
import { supabase, TEST_USER_ID } from '../lib/supabaseClient';

export default function CardForm() {
  const [name, setName] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [nextDueAmount, setNextDueAmount] = useState('');
  const [avgFuture, setAvgFuture] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [cards, setCards] = useState([]);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    const { data, error } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', TEST_USER_ID);
    if (error) console.error('Fetch cards error:', error.message);
    else setCards(data);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    await supabase
      .from('profiles')
      .upsert({ id: TEST_USER_ID, email: 'test@example.com' });

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
          {loading ? 'Saving…' : 'Save Card'}
        </button>
        {message && <p style={{ marginTop: 8 }}>{message}</p>}
      </form>

      <h4>Your Cards:</h4>
      {cards.length === 0 ? (
        <p>No cards yet.</p>
      ) : (
        <ul>
          {cards.map((c) => (
            <li key={c.id}>
              {c.name} — Due {c.next_due_date} (${c.next_due_amount}), Avg $
              {c.avg_future_amount}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
