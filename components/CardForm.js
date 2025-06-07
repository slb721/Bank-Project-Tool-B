// components/CardForm.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

export default function CardForm({ onSave }) {
  const [name, setName] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [nextDueAmount, setNextDueAmount] = useState('');
  const [avgFutureAmount, setAvgFutureAmount] = useState('');
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

        // Ensure profile exists
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            created_at: new Date().toISOString()
          }, { 
            onConflict: 'id',
            ignoreDuplicates: true 
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

  const handleSave = async () => {
    if (!user) {
      setAlert('User not authenticated');
      return;
    }

    if (!name || !nextDueDate || !nextDueAmount || !avgFutureAmount) {
      setAlert('Please fill in all fields');
      return;
    }

    setAlert('');

    try {
      // Ensure profile exists
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

      // Save the credit card
      const payload = {
        user_id: user.id,
        name: name,
        next_due_date: nextDueDate,
        next_due_amount: parseFloat(nextDueAmount),
        avg_future_amount: parseFloat(avgFutureAmount)
      };

      console.log('Saving card payload:', payload);

      const { data, error } = await supabase
        .from('credit_cards')
        .insert(payload);

      if (error) {
        console.error('Save error:', error);
        setAlert(`Failed to save: ${error.message}`);
        return;
      }

      console.log('Card save successful:', data);
      setAlert('Credit card saved successfully!');
      
      // Clear form
      setName('');
      setNextDueDate('');
      setNextDueAmount('');
      setAvgFutureAmount('');
      
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
      <h2 className={styles.heading}>Add Credit Card</h2>
      
      <div className={styles.formControl}>
        <label>Card Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Chase Freedom"
        />
      </div>

      <div className={styles.formControl}>
        <label>Next Due Date</label>
        <input
          type="date"
          value={nextDueDate}
          onChange={(e) => setNextDueDate(e.target.value)}
        />
      </div>

      <div className={styles.formControl}>
        <label>Next Due Amount</label>
        <input
          type="number"
          step="0.01"
          value={nextDueAmount}
          onChange={(e) => setNextDueAmount(e.target.value)}
          placeholder="Amount due next"
        />
      </div>

      <div className={styles.formControl}>
        <label>Average Future Amount</label>
        <input
          type="number"
          step="0.01"
          value={avgFutureAmount}
          onChange={(e) => setAvgFutureAmount(e.target.value)}
          placeholder="Typical monthly amount"
        />
      </div>

      <button className={styles.button} onClick={handleSave}>
        Add Credit Card
      </button>
      
      {alert && <div className={styles.alert}>{alert}</div>}
    </div>
  );
}