import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function DebugAuth() {
  const [authState, setAuthState] = useState({});
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
  };

  useEffect(() => {
    const checkAuth = async () => {
      addLog('Checking authentication state...');
      
      // Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      addLog(`Session check - Error: ${sessionError?.message || 'None'}`);
      addLog(`Session exists: ${!!session}`);
      
      if (session) {
        addLog(`User email: ${session.user.email}`);
        addLog(`Access token exists: ${!!session.access_token}`);
        addLog(`Token expires at: ${new Date(session.expires_at * 1000).toLocaleString()}`);
      }

      // Check user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      addLog(`User check - Error: ${userError?.message || 'None'}`);
      addLog(`User exists: ${!!user}`);

      setAuthState({ session, user, sessionError, userError });
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(`Auth state changed: ${event}`);
      if (session) {
        addLog(`New session for: ${session.user.email}`);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const testSignOut = async () => {
    addLog('Signing out...');
    const { error } = await supabase.auth.signOut();
    addLog(`Sign out error: ${error?.message || 'None'}`);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Auth Debug Page</h1>
      
      <h2>Current URL:</h2>
      <p>{typeof window !== 'undefined' ? window.location.href : 'Loading...'}</p>
      
      <h2>Hash Fragment:</h2>
      <p>{typeof window !== 'undefined' ? window.location.hash : 'Loading...'}</p>
      
      <h2>Query Parameters:</h2>
      <p>{typeof window !== 'undefined' ? window.location.search : 'Loading...'}</p>
      
      <h2>Auth State:</h2>
      <pre>{JSON.stringify(authState, null, 2)}</pre>
      
      <h2>Real-time Logs:</h2>
      <div style={{ 
        background: '#f0f0f0', 
        padding: '10px', 
        maxHeight: '300px', 
        overflowY: 'scroll',
        fontSize: '12px'
      }}>
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </div>
      
      <button 
        onClick={testSignOut}
        style={{ 
          marginTop: '20px',
          padding: '10px 20px',
          background: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        Test Sign Out
      </button>
    </div>
  );
}