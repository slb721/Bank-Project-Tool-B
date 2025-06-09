import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useScenario } from '../context/ScenarioContext';
import styles from '../styles/Dashboard.module.css';

export default function ScenarioSwitcher({ onChange }) {
  const { activeScenario, setActiveScenario } = useScenario();
  const [scenarios, setScenarios] = useState([]);
  const [newScenario, setNewScenario] = useState('');
  const [duplicating, setDuplicating] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => { fetchScenarios(); }, []);

  const fetchScenarios = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setScenarios([]);
    const { data, error } = await supabase.from('scenarios').select('*').eq('user_id', user.id).order('created_at');
    setScenarios(data || []);
  };

  const handleSelect = (e) => {
    setActiveScenario(e.target.value || null);
    if (onChange) onChange();
  };

  const handleCreate = async () => {
    if (!newScenario.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('scenarios').insert({
      user_id: user.id,
      name: newScenario.trim(),
    });
    setNewScenario('');
    await fetchScenarios();
    if (onChange) onChange();
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    const original = scenarios.find(s => s.id === activeScenario);
    if (!original) { setDuplicating(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setDuplicating(false); return; }
    const { data, error } = await supabase.from('scenarios').insert({
      user_id: user.id,
      name: original.name + ' (Copy)'
    }).select();
    if (data && data[0]) {
      await fetchScenarios();
      setActiveScenario(data[0].id);
      if (onChange) onChange();
    }
    setDuplicating(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this scenario and all related data?')) return;
    await supabase.from('scenarios').delete().eq('id', id);
    await fetchScenarios();
    setActiveScenario(null);
    if (onChange) onChange();
  };

  // --- RESET FUNCTIONALITY ---
  const handleReset = async () => {
    if (!activeScenario) {
      alert("You can't reset the default scenario.");
      return;
    }
    if (!window.confirm('Reset ALL values for this scenario? This cannot be undone.')) return;
    setResetting(true);
    const { data: { user } } = await supabase.auth.getUser();
    // Remove all paychecks, cards, events, and account for this scenario
    await supabase.from('paychecks').delete().eq('user_id', user.id).eq('scenario_id', activeScenario);
    await supabase.from('credit_cards').delete().eq('user_id', user.id).eq('scenario_id', activeScenario);
    await supabase.from('life_events').delete().eq('user_id', user.id).eq('scenario_id', activeScenario);
    await supabase.from('accounts').delete().eq('user_id', user.id).eq('scenario_id', activeScenario);
    setResetting(false);
    if (onChange) onChange();
  };

  return (
    <div className={styles.card} style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <label><b>Scenario:</b></label>
        <select value={activeScenario || ''} onChange={handleSelect} style={{ minWidth: 200 }}>
          <option value="">Default</option>
          {scenarios.map(s =>
            <option key={s.id} value={s.id}>{s.name}</option>
          )}
        </select>
        <input
          type="text"
          value={newScenario}
          placeholder="New scenario name"
          onChange={e => setNewScenario(e.target.value)}
          style={{ minWidth: 160 }}
        />
        <button onClick={handleCreate} disabled={!newScenario.trim()}>+ New</button>
        <button onClick={handleDuplicate} disabled={!activeScenario || duplicating}>Duplicate</button>
        {activeScenario && (
          <>
            <button
              onClick={handleReset}
              style={{
                background: '#f4e5c3',
                color: '#b27805',
                border: '1px solid #d8b566',
                borderRadius: 5
              }}
              disabled={resetting}
            >
              {resetting ? 'Resetting...' : 'Reset Scenario'}
            </button>
            <button
              onClick={() => handleDelete(activeScenario)}
              style={{
                background: '#fff7f7',
                color: '#c0392b',
                border: '1px solid #c0392b',
                borderRadius: 5
              }}
            >Delete</button>
          </>
        )}
      </div>
    </div>
  );
}
