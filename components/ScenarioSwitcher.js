import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useScenario } from '../context/ScenarioContext';
import styles from '../styles/Dashboard.module.css';

function normalizeScenarioId(scenarioId) {
  return (
    !scenarioId ||
    scenarioId === '' ||
    scenarioId === '00000000-0000-0000-0000-000000000000'
  )
    ? null
    : scenarioId;
}

export default function ScenarioSwitcher() {
  const { scenarios, activeScenario, setActiveScenario, refreshScenarios } = useScenario();
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!window.confirm("This will remove ALL data for this scenario. Are you sure?")) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setLoading(false);
    const normScenarioId = normalizeScenarioId(activeScenario);

    // Helper to build proper query based on scenarioId (null or UUID)
    const scenarioFilter = (q) => (
      normScenarioId === null
        ? q.is('scenario_id', null)
        : q.eq('scenario_id', normScenarioId)
    );

    await Promise.all([
      scenarioFilter(supabase.from('accounts').delete().eq('user_id', user.id)),
      scenarioFilter(supabase.from('paychecks').delete().eq('user_id', user.id)),
      scenarioFilter(supabase.from('credit_cards').delete().eq('user_id', user.id)),
      scenarioFilter(supabase.from('life_events').delete().eq('user_id', user.id)),
    ]);
    refreshScenarios && refreshScenarios();
    setLoading(false);
    window.location.reload();
  };

  return (
    <div className={styles.scenarioSwitcherContainer}>
      <div>
        <label className={styles.label}>Scenario:</label>
        <select
          value={activeScenario}
          onChange={e => setActiveScenario(e.target.value)}
          className={styles.select}
        >
          {scenarios.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button
          onClick={handleReset}
          disabled={loading}
          className={styles.button}
          style={{ marginLeft: 12, background: '#fff7f7', color: '#c0392b', border: '1px solid #c0392b' }}
        >
          {loading ? 'Resetting...' : 'Reset Scenario'}
        </button>
      </div>
    </div>
  );
}
