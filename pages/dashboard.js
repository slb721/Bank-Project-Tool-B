// pages/dashboard.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import BalanceForm from '../components/BalanceForm';
import PaycheckForm from '../components/PaycheckForm';
import CardForm from '../components/CardForm';
import Projections from '../components/Projections';
import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
  const [session, setSession] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // 1) Parse magic-link tokens on page load (if you haven't done this in _app.js,
    //    you can do it here once):
    supabase.auth.getSessionFromUrl({ storeSession: true }).catch(() => {});

    // 2) Now fetch the stored session
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login');
      } else {
        setSession(data.session);
      }
    });
  }, [router]);

  // While we’re fetching/redirecting, just show loading
  if (session === null) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading your dashboard…</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Your Dashboard</h2>
        <div className={styles.userInfo}>
          <span>Welcome, {session.user.email}</span>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.replace('/login'))}
            className={styles.signOutButton}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        <BalanceForm onSave={() => {}} />
        <PaycheckForm onSave={() => {}} />
        <CardForm onSave={() => {}} />
        <Projections refresh={0} />
      </div>
    </div>
  );
}
