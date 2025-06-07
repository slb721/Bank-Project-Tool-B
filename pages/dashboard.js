// pages/dashboard.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import BalanceForm from '../components/BalanceForm';
import PaycheckForm from '../components/PaycheckForm';
import CardForm from '../components/CardForm';
import Projections from '../components/Projections';
import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Auth error:', error);
          router.push('/login');
          return;
        }

        if (!user) {
          router.push('/login');
          return;
        }

        setUser(user);
      } catch (err) {
        console.error('Unexpected auth error:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  const bump = () => setRefresh((v) => v + 1);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      // The auth state change listener will handle the redirect
    } catch (err) {
      console.error('Unexpected sign out error:', err);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Your Dashboard</h2>
        <div className={styles.userInfo}>
          <span>Welcome, {user.email}</span>
          <button onClick={handleSignOut} className={styles.signOutButton}>
            Sign Out
          </button>
        </div>
      </div>
      
      <div className={styles.dashboardGrid}>
        <BalanceForm onSave={bump} />
        <PaycheckForm onSave={bump} />
        <CardForm onSave={bump} />
        <Projections refresh={refresh} />
      </div>
    </div>
  );
}
