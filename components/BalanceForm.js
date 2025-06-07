// components/BalanceForm.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

export default function BalanceForm({ onSave }) {
  const [balance, setBalance] = useState('');
  const [alert, setAlert] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get current user and ensure profile exists
  useEffect(() => {
    async function initializeUser() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          setAlert('User not authenticated');
          setLoading(false);
          return;
        }

        setUser(user);

        // Ensure profile exists (upsert profile)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            created_at: new Date().toISOString()
          }, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          setAlert('Failed to create user profile');
        }

      } catch (err) {
        console.error('Initialization error:', err);
        setAlert('Failed to initialize user');
      } finally {
        setLoading(false);
      }
    }

    initializeUser();
  }, []);

  // Load existing balance once user is ready
  useEffect(() => {
    if (!user || loading) return;
    
    async function fetchBalance() {
      try {
        const { data, error } = await supabase
          .from('accounts')
          .select('current_balance')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Fetch balance error:', error);
          return;
        }
        
        if (data) {
          setBalance(data.current_balance.toString());
        }
      } catch (err) {
        console.error('Unexpected fetch error:', err);
      }
    }
    
    fetchBalance();
  }, [user, loading]);

  const handleSave = async () => {
    if (!user) {
      setAlert('User not authenticated');
      return;
    }

    if (!balance || isNaN(parseFloat(balance))) {
      setAlert('Please enter a valid balance');
      return;
    }

    setAlert('');

    try {
      // First ensure profile exists (just in case)
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          created_at: new Date().toISOString()
        }, { 
          onConflict: 'id',
          ignoreDuplicates: true 
        });

      // Then save the account balance
      const payload = {
        user_id: user.id,
        current_balance: parseFloat(balance)
      };

      console.log('Saving payload:', payload);

      const { data, error } = await supabase
        .from('accounts')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) {
        console.error('Save error:', error);
        setAlert(`Failed to save: ${error.message}`);
        return;
      }

      console.log('Save successful:', data);
      setAlert('Balance saved successfully!');
      if (onSave) onSave();

    } catch (err) {
      console.error('Unexpected save error:', err);
      setAlert('Unexpected error occurred');
    }
  };

  if (loading) {
    return (
      <div className={styles.card}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.card}>
        <div className={styles.alert}>Please log in to continue</div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>Current Balance</h2>
      <div className={styles.formControl}>
        <label>Balance</label>
        <input
          type="number"
          step="0.01"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          placeholder="Enter your current balance"
        />
      </div>
      <button className={styles.button} onClick={handleSave}>
        Save Balance
      </button>
      {alert && <div className={styles.alert}>{alert}</div>}
    </div>
  );
}