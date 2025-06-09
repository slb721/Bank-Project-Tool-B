// components/ScenarioSwitcher.js

import React, { useState } from 'react';
import { useScenario } from '../context/ScenarioContext';
import { createScenario, duplicateScenario, deleteScenario } from '../lib/scenarioService';

export default function ScenarioSwitcher() {
  const { scenarios, activeScenario, setActiveScenario, refreshScenarios, user } = useScenario();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [dupName, setDupName] = useState('');
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [error, setError] = useState(null);

  if (!user) return null;

  // Create scenario
  const handleCreate = async () => {
    setError(null);
    if (!newName.trim()) {
      setError('Enter a scenario name.');
      return;
    }
    try {
      await createScenario(user.id, newName.trim());
      setNewName('');
      setCreating(false);
      await refreshScenarios();
    } catch (e) {
      setError('Failed to create scenario: ' + (e.message || 'Unknown error'));
    }
  };

  // Duplicate scenario
  const handleDuplicate = async () => {
    setError(null);
    if (!activeScenario || !dupName.trim()) {
      setError('Select a scenario and enter a new name.');
      return;
    }
    try {
      await duplicateScenario(user.id, activeScenario, dupName.trim());
      setDupName('');
      setShowDuplicate(false);
      await refreshScenarios();
    } catch (e) {
      setError('Failed to duplicate scenario: ' + (e.message || 'Unknown error'));
    }
  };

  // Delete scenario
  const handleDelete = async () => {
    setError(null);
    if (!activeScenario) return;
    if (!window.confirm('Delete this scenario?')) return;
    try {
      await deleteScenario(user.id, activeScenario);
      setActiveScenario(null);
      await refreshScenarios();
    } catch (e) {
      setError('Failed to delete scenario: ' + (e.message || 'Unknown error'));
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
      <label style={{ fontWeight: 500 }}>Scenario:</label>
      <select
        value={activeScenario || ''}
        onChange={e => setActiveScenario(e.target.value || null)}
        style={{ padding: '0.5rem', borderRadius: 8, minWidth: 160 }}
      >
        <option value="">Default</option>
        {scenarios.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <button onClick={() => setCreating(c => !c)} style={{ padding: '0.5rem 1rem', borderRadius: 8 }}>
        + New
      </button>
      <button onClick={() => setShowDuplicate(d => !d)} style={{ padding: '0.5rem 1rem', borderRadius: 8 }}>
        Duplicate
      </button>
      {activeScenario && (
        <button onClick={handleDelete} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: '#ef4444', color: 'white' }}>
          Delete
        </button>
      )}
      {creating && (
        <span>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Scenario name"
            style={{ marginLeft: 8, padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc' }}
          />
          <button onClick={handleCreate} style={{ marginLeft: 4, padding: '0.4rem 1rem', borderRadius: 6, background: '#10b981', color: 'white' }}>
            Create
          </button>
        </span>
      )}
      {showDuplicate && (
        <span>
          <input
            value={dupName}
            onChange={e => setDupName(e.target.value)}
            placeholder="Copy name"
            style={{ marginLeft: 8, padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc' }}
          />
          <button onClick={handleDuplicate} style={{ marginLeft: 4, padding: '0.4rem 1rem', borderRadius: 6, background: '#6366f1', color: 'white' }}>
            Duplicate
          </button>
        </span>
      )}
      {error && <span style={{ color: 'red', marginLeft: 16, fontWeight: 500 }}>{error}</span>}
    </div>
  );
}
