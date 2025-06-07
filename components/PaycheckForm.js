// components/PaycheckForm.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

export default function PaycheckForm({ onSave }) {
  const [amount, setAmount] = useState('');
  const [schedule, setSchedule] = useState('bi-weekly');
  const [nextDate, setNextDate] = useState('');
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

    if (!amount || !schedule || !nextDate) {
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

      // Save the paycheck
      const payload = {
        user_id: user.id,
        amount: parseFloat(amount),
        schedule: schedule,
        next_date: nextDate
      };

      console.log('Saving paycheck payload:', payload);

      const { data, error } = await supabase
        .from('paychecks')
        .insert(payload);

      if (error) {
        console.error('Save error:', error);
        setAlert(`Failed to save: ${error.message}`);
        return;
      }

      console.log('Paycheck save successful:', data);
      setAlert('Paycheck saved successfully!');
      
      // Clear form
      setAmount('');
      setSchedule('bi-weekly');
      setNextDate('');
      
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
      <h2 className={styles.heading}>Add Paycheck</h2>
      
      <div className={styles.formControl}>
        <label>Amount</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Paycheck amount"
        />
      </div>

      <div className={styles.formControl}>
        <label>Schedule</label>
        <select
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
        >
          <option value="weekly">Weekly</option>
          <option value="bi-weekly">Bi-weekly</option>
          <option value="monthly">Monthly</option>
          <option value="semi-monthly">Semi-monthly</option>
        </select>
      </div>

      <div className={styles.formControl}>
        <label>Next Paycheck Date</label>
        <input
          type="date"
          value={nextDate}
          onChange={(e) => setNextDate(e.target.value)}
        />
      </div>

      <button className={styles.button} onClick={handleSave}>
        Add Paycheck
      </button>
      
      {alert && <div className={styles.alert}>{alert}</div>}
    </div>
  );
}