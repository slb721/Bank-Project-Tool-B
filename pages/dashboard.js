import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const [session, setSession] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login'); // No session = send to login
      } else {
        setSession(session);
      }
    });
  }, []);

  if (!session) return <p>Loading...</p>;

  return <h1>Welcome to your dashboard</h1>;
}
