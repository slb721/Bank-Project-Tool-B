// lib/scenarioService.js

import { supabase } from './supabaseClient';

// List all scenarios for a user
export async function listScenarios(userId) {
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

// Create a new, blank scenario
export async function createScenario(userId, name) {
  const { data, error } = await supabase
    .from('scenarios')
    .insert([{ user_id: userId, name }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Duplicate a scenario (deep copy of all related rows)
export async function duplicateScenario(userId, sourceScenarioId, newName) {
  // 1. Create new scenario row
  const { data: newScenario, error: err1 } = await supabase
    .from('scenarios')
    .insert([{ user_id: userId, name: newName }])
    .select()
    .single();
  if (err1) throw err1;

  const newScenarioId = newScenario.id;

  // 2. Helper: deep copy for each relevant table
  const tables = [
    { table: 'accounts', fields: ['current_balance'] },
    { table: 'paychecks', fields: ['amount', 'schedule', 'next_date'] },
    { table: 'credit_cards', fields: ['name', 'next_due_date', 'next_due_amount', 'avg_future_amount'] }
  ];

  for (const { table, fields } of tables) {
    // Fetch source rows
    const { data: rows, error: err2 } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .eq('scenario_id', sourceScenarioId);
    if (err2) throw err2;

    if (rows.length === 0) continue;

    // Insert clones with new scenario_id
    const clones = rows.map(row => {
      const clone = { user_id: userId, scenario_id: newScenarioId };
      for (const f of fields) clone[f] = row[f];
      return clone;
    });

    const { error: err3 } = await supabase
      .from(table)
      .insert(clones);
    if (err3) throw err3;
  }

  return newScenario;
}

// Delete scenario and all its data (CASCADE will clean up children)
export async function deleteScenario(userId, scenarioId) {
  const { error } = await supabase
    .from('scenarios')
    .delete()
    .eq('user_id', userId)
    .eq('id', scenarioId);
  if (error) throw error;
}
