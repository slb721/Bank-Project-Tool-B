// pages/login.js
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const sendMagicLink = async () => {
    setMsg('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { redirectTo: window.location.origin },
    });
    if (error) setMsg(error.message);
    else setMsg('Magic link sent—check your email.');
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
      <h2 style={{marginBottom:16}}>Sign In</h2>
      <div className={styles.formControl}>
        <label>Email address</label>
        <input
          type="email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <button className={styles.button} onClick={sendMagicLink}>
        Send Magic Link
      </button>
      {msg && <p style={{marginTop:12, color: '#2563eb'}}>{msg}</p>}
    </div>
  );
}
