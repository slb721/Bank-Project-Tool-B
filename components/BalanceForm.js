// components/BalanceForm.js

import { useState, useEffect } from 'react';
import { supabase, TEST_USER_ID } from '../lib/supabaseClient';

export default function BalanceForm({ onSave }) {
  const [balance, setBalance] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from('accounts')
      .select('current_balance')
      .eq('user_id', TEST_USER_ID)
      .single()
      .then(({ data, error }) => {
        if (error && error.code !== 'PGRST116') {
          console.error('Fetch balance error:', error.message);
        } else if (data) {
          setBalance(data.current_balance);
        }
      });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    await supabase
      .from('profiles')
      .upsert({ id: TEST_USER_ID, email: 'test@example.com' });

    const { error } = await supabase
      .from('accounts')
      .upsert(
        { user_id: TEST_USER_ID, current_balance: balance },
        { onConflict: 'user_id' }
      );

    setLoading(false);
    if (error) {
      console.error('Error saving balance:', error.message);
      setMessage('Error: ' + error.message);
    } else {
      setMessage('Balance saved.');
      onSave(); // notify Dashboard to refresh projections
    }
  };

  return (
    <form onSubmit={handleSave} style={{ marginBottom: 20 }}>
      <label>
        Current Balance
        <input
          type="number"
          step="0.01"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          required
          style={{ display: 'block', width: '100%', marginBottom: 8 }}
        />
      </label>
      <button type="submit" style={{ width: '100%' }} disabled={loading}>
        {loading ? 'Saving…' : 'Save Balance'}
      </button>
      {message && <p style={{ marginTop: 8 }}>{message}</p>}
    </form>
  );
}
