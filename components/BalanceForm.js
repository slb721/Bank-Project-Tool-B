// components/BalanceForm.js

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

export default function BalanceForm({ onSave }) {
  const [balance, setBalance] = useState('');
  const [currentBalance, setCurrentBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch current balance on component mount
  useEffect(() => {
    fetchCurrentBalance();
  }, []);

  const fetchCurrentBalance = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('User not authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('accounts')
        .select('current_balance')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching balance:', error);
        setError('Failed to fetch current balance');
      } else if (data) {
        setCurrentBalance(data.current_balance);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('User not authenticated');
        return;
      }

      const balanceValue = parseFloat(balance);
      if (isNaN(balanceValue)) {
        setError('Please enter a valid number');
        return;
      }

      // Check if account already exists
      const { data: existingAccount } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingAccount) {
        // Update existing account
        const { error } = await supabase
          .from('accounts')
          .update({ current_balance: balanceValue })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating balance:', error);
          setError('Failed to update balance');
          return;
        }
      } else {
        // Insert new account
        const { error } = await supabase
          .from('accounts')
          .insert([{
            user_id: user.id,
            current_balance: balanceValue,
            created_at: new Date().toISOString()
          }]);

        if (error) {
          console.error('Error inserting balance:', error);
          setError('Failed to save balance');
          return;
        }
      }

      setSuccess('Balance saved successfully!');
      setCurrentBalance(balanceValue);
      setBalance('');
      onSave && onSave();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h3>Account Balance</h3>
      
      {currentBalance !== null && (
        <div className={styles.currentInfo}>
          <p>Current Balance: <strong>${currentBalance.toFixed(2)}</strong></p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="balance">New Balance:</label>
          <input
            type="number"
            id="balance"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="Enter your current balance"
            required
            disabled={loading}
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <button 
          type="submit" 
          disabled={loading || !balance}
          className={styles.button}
        >
          {loading ? 'Saving...' : 'Update Balance'}
        </button>
      </form>
    </div>
  );
}