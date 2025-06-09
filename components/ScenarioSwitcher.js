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
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  // Helper: reset local UI
  const resetCreate = () => {
    setNewName('');
    setCreating(false);
    setError(null);
    setLoading(false);
  };

  // --- CREATE Scenario ---
  const handleCreate = async () => {
    setError(null);
    if (!newName.trim()) {
      setError('Enter a scenario name.');
      return;
    }
    if (!user || !user.id) {
      setError('User not loaded. Please sign in again.');
      return;
    }
    setLoading(true);
    try {
      console.log('Creating scenario for user:', user);
      await createScenario(user.id, newName.trim());
      resetCreate();
      await refreshScenarios();
    } catch (e) {
      console.error('Scenario creation failed:', e);
      setError('Failed to create scenario: ' + (e.message || e.error_description || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // --- DUPLICATE Scenario ---
  const handleDuplicate = async () => {
    setError(null);
    if (!dupSource || !dupName.trim()) {
      setError('Select a scenario and enter a new name.');
      return;
    }
    if (!user || !user.id) {
      setError('User not loaded. Please sign in again.');
      return;
    }
    setLoading(true);
    try {
      console.log('Duplicating scenario', dupSource, 'for user:', user);
      await duplicateScenario(user.id, dupSource, dupName.trim());
      setDupName('');
      setDupSource('');
      await refreshScenarios();
    } catch (e) {
      console.error('Scenario duplication failed:', e);
      setError('Failed to duplicate scenario: ' + (e.message || e.error_description || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // --- DELETE Scenario ---
  const handleDelete = async () => {
    setError(null);
    if (!activeScenario) return;
    if (!window.confirm('Delete this scenario?')) return;
    setLoading(true);
    try {
      await deleteScenario(user.id, activeScenario);
      setActiveScenario(null);
      await refreshScenarios();
    } catch (e) {
      console.error('Scenario deletion failed:', e);
      setError('Failed to delete scenario: ' + (e.message || e.error_description || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      marginBottom: '2rem'
    }}>
      <label style={{ fontWeight: 500 }}>Scenario: </label>
      {/* --- SCENARIO SWITCHER DROPDOWN --- */}
      <select
        value={activeScenario || ''}
        onChange={e => setActiveScenario(e.target.value || null)}
        style={{ padding: '0.5rem', borderRadius: 8 }}
        disabled={loading}
      >
        <option value="">Default</option>
        {scenarios.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      {/* --- CREATE SCENARIO BUTTON/FORM --- */}
      <button
        style={{
          padding: '0.5rem 1rem',
          borderRadius: 8,
          background: '#3b82f6',
          color: 'white',
          fontWeight: 600
        }}
        onClick={() => setCreating(c => !c)}
        disabled={loading}
      >+ New</button>
      {creating && (
        <span>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Scenario name"
            style={{ marginLeft: 8, padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc' }}
            disabled={loading}
          />
          <button
            style={{
              marginLeft: 4,
              padding: '0.4rem 1rem',
              borderRadius: 6,
              background: '#10b981',
              color: 'white'
            }}
            onClick={handleCreate}
            disabled={loading}
          >Create</button>
        </span>
      )}

      {/* --- DUPLICATE SCENARIO FORM --- */}
      <span>
        <select
          value={dupSource}
          onChange={e => setDupSource(e.target.value)}
          style={{ padding: '0.4rem', borderRadius: 6 }}
          disabled={loading}
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
          disabled={loading}
        />
        <button
          disabled={!dupSource || !dupName.trim() || loading}
          style={{
            marginLeft: 4,
            padding: '0.4rem 1rem',
            borderRadius: 6,
            background: !dupSource || !dupName.trim() ? '#ccc' : '#6366f1',
            color: 'white'
          }}
          onClick={handleDuplicate}
        >Duplicate</button>
      </span>

      {/* --- DELETE SCENARIO --- */}
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
          onClick={handleDelete}
          disabled={loading}
        >Delete</button>
      )}

      {/* --- ERROR UI --- */}
      {error && (
        <span style={{ color: 'red', marginLeft: 16, fontWeight: 500 }}>{error}</span>
      )}
    </div>
  );
}
