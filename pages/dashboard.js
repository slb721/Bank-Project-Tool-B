import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import BalanceForm from '../components/BalanceForm';
import PaycheckForm from '../components/PaycheckForm';
import CardForm from '../components/CardForm';
import Projections from '../components/Projections';
import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const router = useRouter();

  const bump = () => setRefresh((v) => v + 1);

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
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Your Dashboard</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>Welcome, {session.user.email}</span>
          <button 
            onClick={() => supabase.auth.signOut()}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#ff4444', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
      
      <BalanceForm onSave={bump} />
      <PaycheckForm onSave={bump} />
      <CardForm onSave={bump} />
      <Projections refresh={refresh} />
    </div>
  );
}