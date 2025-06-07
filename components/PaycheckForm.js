// components/PaycheckForm.js

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

export default function PaycheckForm({ onSave }) {
  const [formData, setFormData] = useState({
    amount: '',
    schedule: 'monthly',
    next_date: ''
  });
  const [paychecks, setPaychecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch existing paychecks on component mount
  useEffect(() => {
    fetchPaychecks();
  }, []);

  const fetchPaychecks = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('User not authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('paychecks')
        .select('*')
        .eq('user_id', user.id)
        .order('next_date', { ascending: true });

      if (error) {
        console.error('Error fetching paychecks:', error);
        setError('Failed to fetch paychecks');
      } else {
        setPaychecks(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (!formData.next_date) {
        setError('Please select a date');
        return;
      }

      // Insert new paycheck
      const { error } = await supabase
        .from('paychecks')
        .insert([{
          user_id: user.id,
          amount: amount,
          schedule: formData.schedule,
          next_date: formData.next_date,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error inserting paycheck:', error);
        setError('Failed to save paycheck');
        return;
      }

      setSuccess('Paycheck saved successfully!');
      setFormData({
        amount: '',
        schedule: 'monthly',
        next_date: ''
      });
      
      // Refresh the list
      await fetchPaychecks();
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

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this paycheck?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('paychecks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting paycheck:', error);
        setError('Failed to delete paycheck');
      } else {
        setSuccess('Paycheck deleted successfully!');
        await fetchPaychecks();
        onSave && onSave();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    }
  };

  return (
    <div className={styles.card}>
      <h3>Paychecks</h3>

      {/* Existing Paychecks List */}
      {paychecks.length > 0 && (
        <div className={styles.itemsList}>
          <h4>Your Paychecks:</h4>
          {paychecks.map((paycheck) => (
            <div key={paycheck.id} className={styles.listItem}>
              <div>
                <strong>${paycheck.amount}</strong> - {paycheck.schedule}
                <br />
                <small>Next: {new Date(paycheck.next_date).toLocaleDateString()}</small>
              </div>
              <button
                onClick={() => handleDelete(paycheck.id)}
                className={styles.deleteButton}
                type="button"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="amount">Paycheck Amount:</label>
          <input
            type="number"
            id="amount"
            name="amount"
            step="0.01"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="Enter amount"
            required
            disabled={loading}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="schedule">Schedule:</label>
          <select
            id="schedule"
            name="schedule"
            value={formData.schedule}
            onChange={handleInputChange}
            required
            disabled={loading}
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="bimonthly">Bi-monthly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="next_date">Next Paycheck Date:</label>
          <input
            type="date"
            id="next_date"
            name="next_date"
            value={formData.next_date}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <button 
          type="submit" 
          disabled={loading}
          className={styles.button}
        >
          {loading ? 'Saving...' : 'Add Paycheck'}
        </button>
      </form>
    </div>
  );
}