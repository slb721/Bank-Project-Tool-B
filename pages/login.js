// pages/login.js

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const sendMagicLink = async () => {
    setMessage('');
    const dashboardUrl = `${window.location.origin}/dashboard`;
    console.log('>> Sending magic link for:', email, { redirectTo: `${window.location.origin}/dashboard` });
    const { data, error } = await supabase.auth.signInWithOtp(
      { email },
      { emailRedirectTo: dashboardUrl }
    );

    if (error) setMessage(`Error: ${error.message}`);
    else setMessage('✅ Magic link sent—check your email.');
  };

  return (
    <div style={{
      maxWidth: 360,
      margin: '10% auto',
      padding: 24,
      background: '#fff',
      borderRadius: 8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginBottom: 16 }}>Sign In</h2>
      <div className={styles.formControl}>
        <label>Email address</label>
        <input
          type="email"
          value={email}
          placeholder="you@example.com"
          onChange={e => setEmail(e.target.value)}
        />
      </div>
      <button className={styles.button} onClick={sendMagicLink}>
        Send Magic Link
      </button>
      {message && (
        <p style={{
          marginTop: 12,
          color: message.startsWith('Error') ? '#b91c1c' : '#2563eb'
        }}>
          {message}
        </p>
      )}
    </div>
  );
}
