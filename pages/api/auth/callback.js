import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash fragments from the URL
        const hashFragment = window.location.hash.substring(1);
        const params = new URLSearchParams(hashFragment);
        
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const tokenType = params.get('token_type');

        console.log('Auth callback params:', { accessToken, refreshToken, tokenType });

        if (accessToken) {
          // Set the session manually
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session:', error);
            setError(error.message);
            setTimeout(() => router.push('/login'), 2000);
          } else {
            console.log('Session set successfully:', data);
            // Redirect to dashboard
            router.push('/dashboard');
          }
        } else {
          console.log('No access token found, checking for existing session');
          
          // Check if there's already a session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (session) {
            console.log('Existing session found:', session);
            router.push('/dashboard');
          } else {
            console.log('No session found');
            setError('No authentication data found');
            setTimeout(() => router.push('/login'), 2000);
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Authentication failed');
        setTimeout(() => router.push('/login'), 2000);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Completing authentication...</h2>
        <p>Please wait while we log you in.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <p>Redirecting to login page...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Authentication successful!</h2>
      <p>Redirecting to dashboard...</p>
    </div>
  );
}