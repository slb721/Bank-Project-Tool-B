// context/ScenarioContext.js

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { listScenarios, createScenario } from '../lib/scenarioService';

const ScenarioContext = createContext();

export function ScenarioProvider({ children }) {
  const [scenarios, setScenarios] = useState([]);
  const [activeScenario, setActiveScenario] = useState(null); // null = default
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        listScenarios(user.id).then(setScenarios);
      }
    });
  }, []);

  const refreshScenarios = () => {
    if (user) listScenarios(user.id).then(setScenarios);
  };

  const switchScenario = (scenarioId) => setActiveScenario(scenarioId);

  return (
    <ScenarioContext.Provider value={{
      scenarios,
      activeScenario,
      setActiveScenario: switchScenario,
      refreshScenarios,
      user
    }}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  return useContext(ScenarioContext);
}
