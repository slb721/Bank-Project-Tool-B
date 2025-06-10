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
  const [newScenarioName, setNewScenarioName] = useState('');
  const [showNew, setShowNew] = useState(false);

  const handleReset = async () => {
    if (!window.confirm("This will remove ALL data for this scenario. Are you sure?")) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setLoading(false);
    const normScenarioId = normalizeScenarioId(activeScenario);
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

  const handleNewScenario = async () => {
    if (!newScenarioName) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setLoading(false);
    const { error } = await supabase.from('scenarios').insert({
      user_id: user.id,
      name: newScenarioName,
    });
    setNewScenarioName('');
    setShowNew(false);
    refreshScenarios && refreshScenarios();
    setLoading(false);
  };

  const handleDuplicate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const curr = scenarios.find(s => s.id === activeScenario);
    if (!curr) return;
    setLoading(true);
    const { data: inserted, error } = await supabase.from('scenarios').insert({
      user_id: user.id,
      name: curr.name + ' (Copy)'
    }).select();
    if (inserted && inserted[0]) {
      // Copy paychecks/cards/accounts/life_events
      const [paychecks, cards, accounts, events] = await Promise.all([
        supabase.from('paychecks').select('*').eq('scenario_id', curr.id),
        supabase.from('credit_cards').select('*').eq('scenario_id', curr.id),
        supabase.from('accounts').select('*').eq('scenario_id', curr.id),
        supabase.from('life_events').select('*').eq('scenario_id', curr.id)
      ]);
      const sid = inserted[0].id;
      const { data: { user } } = await supabase.auth.getUser();
      // Copy records to new scenario
      await Promise.all([
        ...(paychecks.data || []).map(p =>
          supabase.from('paychecks').insert({ ...p, id: undefined, scenario_id: sid, user_id: user.id })
        ),
        ...(cards.data || []).map(c =>
          supabase.from('credit_cards').insert({ ...c, id: undefined, scenario_id: sid, user_id: user.id })
        ),
        ...(accounts.data || []).map(a =>
          supabase.from('accounts').insert({ ...a, id: undefined, scenario_id: sid, user_id: user.id })
        ),
        ...(events.data || []).map(ev =>
          supabase.from('life_events').insert({ ...ev, id: undefined, scenario_id: sid, user_id: user.id })
        ),
      ]);
      refreshScenarios && refreshScenarios();
      setActiveScenario(sid);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this scenario?")) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setLoading(false);
    const normScenarioId = normalizeScenarioId(activeScenario);
    if (normScenarioId === null) {
      setLoading(false);
      alert('Default scenario cannot be deleted.');
      return;
    }
    // Remove all data tied to this scenario, then remove scenario row
    await Promise.all([
      supabase.from('accounts').delete().eq('user_id', user.id).eq('scenario_id', normScenarioId),
      supabase.from('paychecks').delete().eq('user_id', user.id).eq('scenario_id', normScenarioId),
      supabase.from('credit_cards').delete().eq('user_id', user.id).eq('scenario_id', normScenarioId),
      supabase.from('life_events').delete().eq('user_id', user.id).eq('scenario_id', normScenarioId),
      supabase.from('scenarios').delete().eq('user_id', user.id).eq('id', normScenarioId),
    ]);
    refreshScenarios && refreshScenarios();
    setActiveScenario(scenarios[0]?.id ?? '');
    setLoading(false);
    window.location.reload();
  };

  return (
    <div className={styles.scenarioSwitcherContainer}>
      <div className={styles.scenarioRow}>
        <label className={styles.label} htmlFor="scenarioSelect">Scenario:</label>
        <select
          id="scenarioSelect"
          value={activeScenario}
          onChange={e => setActiveScenario(e.target.value)}
          className={styles.select}
          style={{ marginRight: 16 }}
        >
          {scenarios.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button className={styles.button} style={{ marginRight: 8, background: '#e3edfc', color: '#2466a7' }} onClick={() => setShowNew(x => !x)} disabled={loading}>
          New Scenario
        </button>
        <button className={styles.button} style={{ marginRight: 8, background: '#f4f7ff', color: '#666' }} onClick={handleDuplicate} disabled={loading}>
          Duplicate
        </button>
        <button className={styles.button} style={{ marginRight: 8, background: '#fce4e4', color: '#c0392b', border: '1px solid #c0392b' }} onClick={handleDelete} disabled={loading}>
          Delete
        </button>
        <button className={styles.button} style={{ background: '#fff7f7', color: '#c0392b', border: '1px solid #c0392b' }} onClick={handleReset} disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Scenario'}
        </button>
      </div>
      {showNew && (
        <div className={styles.scenarioNewRow}>
          <input
            type="text"
            value={newScenarioName}
            onChange={e => setNewScenarioName(e.target.value)}
            placeholder="Scenario name"
            className={styles.input}
            style={{ marginRight: 8 }}
            disabled={loading}
          />
          <button className={styles.button} onClick={handleNewScenario} disabled={loading || !newScenarioName}>Create</button>
        </div>
      )}
    </div>
  );
}
