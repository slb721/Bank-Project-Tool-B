// components/CardForm.js

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

export default function CardForm({ onSave }) {
  const [formData, setFormData] = useState({
    card_name: '',
    next_due_date: '',
    next_due_amount: '',
    avg_future_amount: ''
  });
  const [creditCards, setCreditCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch existing credit cards on component mount
  useEffect(() => {
    fetchCreditCards();
  }, []);

  const fetchCreditCards = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('User not authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('next_due_date', { ascending: true });

      if (error) {
        console.error('Error fetching credit cards:', error);
        setError('Failed to fetch credit cards');
      } else {
        setCreditCards(data || []);
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

      const nextDueAmount = parseFloat(formData.next_due_amount);
      const avgFutureAmount = parseFloat(formData.avg_future_amount);

      if (isNaN(nextDueAmount) || nextDueAmount < 0) {
        setError('Please enter a valid next due amount');
        return;
      }

      if (isNaN(avgFutureAmount) || avgFutureAmount < 0) {
        setError('Please enter a valid average future amount');
        return;
      }

      if (!formData.next_due_date) {
        setError('Please select a due date');
        return;
      }

      if (!formData.card_name.trim()) {
        setError('Please enter a card name');
        return;
      }

      // Insert new credit card
      const { error } = await supabase
        .from('credit_cards')
        .insert([{
          user_id: user.id,
          card_name: formData.card_name.trim(),
          next_due_date: formData.next_due_date,
          next_due_amount: nextDueAmount,
          avg_future_amount: avgFutureAmount,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error inserting credit card:', error);
        setError('Failed to save credit card');
        return;
      }

      setSuccess('Credit card saved successfully!');
      setFormData({
        card_name: '',
        next_due_date: '',
        next_due_amount: '',
        avg_future_amount: ''
      });
      
      // Refresh the list
      await fetchCreditCards();
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
    if (!confirm('Are you sure you want to delete this credit card?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('credit_cards')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting credit card:', error);
        setError('Failed to delete credit card');
      } else {
        setSuccess('Credit card deleted successfully!');
        await fetchCreditCards();
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
      <h3>Credit Cards</h3>

      {/* Existing Credit Cards List */}
      {creditCards.length > 0 && (
        <div className={styles.itemsList}>
          <h4>Your Credit Cards:</h4>
          {creditCards.map((card) => (
            <div key={card.id} className={styles.listItem}>
              <div>
                <strong>{card.card_name}</strong>
                <br />
                <small>Next Due: {new Date(card.next_due_date).toLocaleDateString()} - ${card.next_due_amount}</small>
                <br />
                <small>Avg Future: ${card.avg_future_amount}</small>
              </div>
              <button
                onClick={() => handleDelete(card.id)}
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
          <label htmlFor="card_name">Card Name:</label>
          <input
            type="text"
            id="card_name"
            name="card_name"
            value={formData.card_name}
            onChange={handleInputChange}
            placeholder="Enter card name (e.g., Chase Sapphire)"
            required
            disabled={loading}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="next_due_date">Next Due Date:</label>
          <input
            type="date"
            id="next_due_date"
            name="next_due_date"
            value={formData.next_due_date}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="next_due_amount">Next Due Amount:</label>
          <input
            type="number"
            id="next_due_amount"
            name="next_due_amount"
            step="0.01"
            value={formData.next_due_amount}
            onChange={handleInputChange}
            placeholder="Enter next payment amount"
            required
            disabled={loading}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="avg_future_amount">Average Future Amount:</label>
          <input
            type="number"
            id="avg_future_amount"
            name="avg_future_amount"
            step="0.01"
            value={formData.avg_future_amount}
            onChange={handleInputChange}
            placeholder="Enter typical monthly payment"
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
          {loading ? 'Saving...' : 'Add Credit Card'}
        </button>
      </form>
    </div>
  );
}