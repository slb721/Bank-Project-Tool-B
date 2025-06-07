import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Redirect to the client-side callback page
    const redirectUrl = "https://bank-project-tool-b.vercel.app/auth/callback";
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      setMessage("Login error: " + error.message);
    } else {
      setMessage("Check your email for the magic link.");
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Login page - Current session:', session);
      
      if (session) {
        console.log('User already logged in, redirecting to dashboard');
        router.push('/dashboard');
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Login page - Auth state changed:', event, session);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in, redirecting to dashboard');
        router.push('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>
        <button 
          type="submit"
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: '#0070f3', 
            color: 'white', 
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Send Magic Link
        </button>
      </form>
      {message && (
        <p style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: message.includes('error') ? '#ffebee' : '#e8f5e8',
          color: message.includes('error') ? '#c62828' : '#2e7d32',
          borderRadius: '4px'
        }}>
          {message}
        </p>
      )}
    </div>
  );
}