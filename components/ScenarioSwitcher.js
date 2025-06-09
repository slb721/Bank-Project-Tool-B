// components/ScenarioSwitcher.js
import React, { useState } from 'react';
import { useScenario } from '../context/ScenarioContext';
import { createScenario, duplicateScenario, deleteScenario } from '../lib/scenarioService';

export default function ScenarioSwitcher() {
  const { scenarios, activeScenario, setActiveScenario, refreshScenarios, user } = useScenario();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [dupName, setDupName] = useState('');
  const [dupSource, setDupSource] = useState('');

  if (!user) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      marginBottom: '2rem'
    }}>
      <label style={{ fontWeight: 500 }}>Scenario: </label>
      <select
        value={activeScenario || ''}
        onChange={e => setActiveScenario(e.target.value || null)}
        style={{ padding: '0.5rem', borderRadius: 8 }}
      >
        <option value="">Default</option>
        {scenarios.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <button
        style={{ padding: '0.5rem 1rem', borderRadius: 8, background: '#3b82f6', color: 'white', fontWeight: 600 }}
        onClick={() => setCreating(c => !c)}
      >+ New</button>
      {creating && (
        <span>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Scenario name"
            style={{ marginLeft: 8, padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc' }}
          />
          <button
            style={{ marginLeft: 4, padding: '0.4rem 1rem', borderRadius: 6, background: '#10b981', color: 'white' }}
            onClick={async () => {
              if (!newName.trim()) return;
              await createScenario(user.id, newName.trim());
              setNewName('');
              setCreating(false);
              refreshScenarios();
            }}
          >Create</button>
        </span>
      )}
      <span>
        <select
          value={dupSource}
          onChange={e => setDupSource(e.target.value)}
          style={{ padding: '0.4rem', borderRadius: 6 }}
        >
          <option value="">Duplicate…</option>
          {scenarios.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <input
          value={dupName}
          onChange={e => setDupName(e.target.value)}
          placeholder="New scenario name"
          style={{ marginLeft: 4, padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc' }}
        />
        <button
          disabled={!dupSource || !dupName.trim()}
          style={{
            marginLeft: 4,
            padding: '0.4rem 1rem',
            borderRadius: 6,
            background: !dupSource || !dupName.trim() ? '#ccc' : '#6366f1',
            color: 'white'
          }}
          onClick={async () => {
            if (!dupSource || !dupName.trim()) return;
            await duplicateScenario(user.id, dupSource, dupName.trim());
            setDupName('');
            setDupSource('');
            refreshScenarios();
          }}
        >Duplicate</button>
      </span>
      {activeScenario && (
        <button
          style={{
            marginLeft: 8,
            padding: '0.4rem 1rem',
            borderRadius: 6,
            background: '#ef4444',
            color: 'white',
            fontWeight: 600
          }}
          onClick={async () => {
            if (window.confirm('Delete this scenario?')) {
              await deleteScenario(user.id, activeScenario);
              setActiveScenario(null);
              refreshScenarios();
            }
          }}
        >Delete</button>
      )}
    </div>
  );
}
