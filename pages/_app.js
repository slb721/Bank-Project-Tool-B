// pages/_app.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import '../styles/globals.css';

export default function MyApp({ Component, pageProps }) {
  const [session, setSession] = useState(null);
  const router = useRouter();

  // Listen for login state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      if (!s) router.push('/login');
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Protect all routes except /login
  useEffect(() => {
    if (session === null && router.pathname !== '/login') {
      router.push('/login');
    }
  }, [session, router]);

  // While we’re figuring out auth, don’t flash content
  if (session === null) {
    if (router.pathname === '/login') return <Component {...pageProps} />;
    return <div style={{textAlign:'center',marginTop:'20%'}}>Loading…</div>;
  }

  return <Component {...pageProps} session={session} {...pageProps} />;
}
