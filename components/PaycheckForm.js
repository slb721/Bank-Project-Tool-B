import { useState } from 'react';
import { supabase, TEST_USER_ID } from '../lib/supabaseClient';

export default function PaycheckForm() {
  const [amount, setAmount] = useState('');
  const [schedule, setSchedule] = useState('biweekly');
  const [nextDate, setNextDate] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    await supabase
      .from('profiles')
      .upsert({ id: TEST_USER_ID, email: 'test@example.com' });

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
      setNextDate('');
      setSchedule('biweekly');
    }
  };

  return (
    <form onSubmit={handleSave} style={{ marginBottom: 20 }}>
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
        {loading ? 'Saving…' : 'Save Paycheck'}
      </button>
      {message && <p style={{ marginTop: 8 }}>{message}</p>}
    </form>
  );
}
