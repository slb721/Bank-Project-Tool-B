import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Dashboard.module.css';
import { useScenario } from '../context/ScenarioContext';

export default function ScenarioSwitcher({ onReset }) {
  const { scenarios, setScenarios, activeScenario, setActiveScenario } = useScenario();
  const [newName, setNewName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchScenarios();
    // eslint-disable-next-line
  }, []);

  const fetchScenarios = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('scenarios')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at');
    setScenarios(data || []);
  };

  const handleSelect = (e) => {
    setActiveScenario(e.target.value);
  };

  const handleCreate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newName.trim()) return;
    await supabase.from('scenarios').insert({
      user_id: user.id,
      name: newName.trim(),
    });
    setNewName('');
    fetchScenarios();
  };

  const handleDuplicate = async () => {
    const orig = scenarios.find(s => s.id === activeScenario);
    if (!orig) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: newScenarioRows } = await supabase.from('scenarios').insert({
      user_id: user.id,
      name: orig.name + ' (Copy)',
    }).select();
    const newScenario = newScenarioRows && newScenarioRows[0];
    if (!newScenario) return;
    const copy = async (table, exclude = []) => {
      const { data } = await supabase.from(table).select('*').eq('user_id', user.id).eq('scenario_id', orig.id);
      if (data && data.length) {
        await Promise.all(data.map(row => {
          const { id, ...rest } = row;
          const filtered = Object.fromEntries(Object.entries(rest).filter(([k]) => !exclude.includes(k)));
          return supabase.from(table).insert({ ...filtered, scenario_id: newScenario.id });
        }));
      }
    };
    await copy('accounts', ['updated_at', 'created_at']);
    await copy('paychecks', ['updated_at', 'created_at']);
    await copy('credit_cards', ['updated_at', 'created_at']);
    await copy('life_events', ['updated_at', 'created_at']);
    fetchScenarios();
    setActiveScenario(newScenario.id);
  };

  // THE BIG RESET BUTTON
  const handleReset = async () => {
    if (!window.confirm('This will permanently delete all paychecks, credit cards, balances, and life events for this scenario. Are you sure?')) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      await supabase.from('accounts').delete().eq('user_id', user.id).eq('scenario_id', activeScenario);
      await supabase.from('paychecks').delete().eq('user_id', user.id).eq('scenario_id', activeScenario);
      await supabase.from('credit_cards').delete().eq('user_id', user.id).eq('scenario_id', activeScenario);
      await supabase.from('life_events').delete().eq('user_id', user.id).eq('scenario_id', activeScenario);
      setMessage('Scenario reset.');
      if (onReset) onReset(); // Extra bump for parent state
      setTimeout(() => setMessage(''), 1500);
      setTimeout(() => { window.location.reload(); }, 200); // This ensures UI/data wipe
    } catch (err) {
      setMessage('Error resetting: ' + err.message);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  return (
    <div className={styles.card} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <label style={{ fontWeight: 500, marginBottom: 0, marginRight: 6 }}>Scenario:</label>
      <select value={activeScenario} onChange={handleSelect} className={styles.input} style={{ minWidth: 140 }}>
        {scenarios.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <input
        className={styles.input}
        placeholder="New scenario name"
        value={newName}
        onChange={e => setNewName(e.target.value)}
        style={{ minWidth: 120, marginLeft: 6 }}
      />
      <button className={styles.button} style={{ marginLeft: 0 }} onClick={handleCreate}>+ New</button>
      <button className={styles.button} onClick={handleDuplicate}>Duplicate</button>
      <button
        className={styles.button}
        style={{
          background: '#fff7f7',
          color: '#c0392b',
          border: '1px solid #c0392b',
          fontWeight: 600,
          padding: '2px 12px',
          fontSize: 13
        }}
        onClick={handleReset}
      >
        Reset Scenario
      </button>
      {message && <span style={{ color: '#38a169', fontSize: 13, marginLeft: 8 }}>{message}</span>}
    </div>
  );
}
