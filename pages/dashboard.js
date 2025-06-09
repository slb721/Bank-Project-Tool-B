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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const { activeScenario } = useScenario();

 

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          router.push('/login');
          return;
        }
        if (!user) {
          router.push('/login');
          return;
        }
        setUser(user);
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

  const bump = () => setRefresh((v) => v + 1);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }
  if (!user) return null;

  return (

    <button onClick={async () => {
      const { data: { user } } = await supabase.auth.getUser();
      alert(user.id);
    }}>
      Show My User ID
    </button>

    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Your Dashboard</h2>
        <div className={styles.userInfo}>
          <span>Welcome, {user.email}</span>
          <button onClick={async () => { await supabase.auth.signOut(); }} className={styles.signOutButton}>
            Sign Out
          </button>
        </div>
      </div>

      <ScenarioSwitcher onReset={bump} />

      <div className={styles.dashboardGrid}>
        <BalanceForm onSave={bump} scenarioId={activeScenario} refresh={refresh} />
        <PaycheckForm onSave={bump} scenarioId={activeScenario} refresh={refresh} />
        <CardForm onSave={bump} scenarioId={activeScenario} refresh={refresh} />
        <LifeEventForm onSave={bump} scenarioId={activeScenario} refresh={refresh} />
        <Projections key={activeScenario} refresh={refresh} className={styles.chartWide} scenarioId={activeScenario} />
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

