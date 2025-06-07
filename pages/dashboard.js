import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Initial session check:', session, error);
      
      if (session) {
        setSession(session);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes (this is crucial for magic links)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN') {
          setSession(session);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          router.push('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Only redirect to login after we've confirmed there's no session AND not loading
  useEffect(() => {
    if (!loading && !session) {
      console.log('No session found, redirecting to login');
      router.push('/login');
    }
  }, [loading, session, router]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome to your dashboard!</h1>
      <p>Email: {session.user.email}</p>
      <button 
        onClick={() => supabase.auth.signOut()}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#ff4444', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Sign Out
      </button>
    </div>
  );
}