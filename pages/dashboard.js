import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import BalanceForm from '../components/BalanceForm';
import PaycheckForm from '../components/PaycheckForm';
import CardForm from '../components/CardForm';
import Projections from '../components/Projections';
import ScenarioSwitcher from '../components/ScenarioSwitcher';
import LifeEventForm from '../components/LifeEventForm';
import { ScenarioProvider, useScenario } from '../context/ScenarioContext';
import styles from '../styles/Dashboard.module.css';

function DashboardInner() {
  const [refresh, setRefresh] = useState(0);
  const [scenarioBump, setScenarioBump] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  const { activeScenario } = useScenario();

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

  useEffect(() => {
    setScenarioBump((v) => v + 1);
  }, [activeScenario]);

  const bump = () => setRefresh((v) => v + 1);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Sign out error:', error);
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
  if (!user) return null;

  // key={activeScenario} on Projections forces chart remount, refresh+bump triggers all forms
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

      {/* SCENARIO SWITCHER at top */}
      <ScenarioSwitcher onReset={() => { setRefresh((v) => v + 1); }} />

      {/* All forms and projections get full refresh triggers */}
      <div className={styles.dashboardGrid}>
        <BalanceForm onSave={bump} scenarioId={activeScenario} refresh={refresh + scenarioBump} />
        <PaycheckForm onSave={bump} scenarioId={activeScenario} refresh={refresh + scenarioBump} />
        <CardForm onSave={bump} scenarioId={activeScenario} refresh={refresh + scenarioBump} />
        <LifeEventForm onSave={bump} scenarioId={activeScenario} refresh={refresh + scenarioBump} />
        <Projections
          key={activeScenario}
          refresh={refresh + scenarioBump}
          className={styles.chartWide}
          scenarioId={activeScenario}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ScenarioProvider>
      <DashboardInner />
    </ScenarioProvider>
  );
}
