// pages/index.js
import Link from 'next/link';

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <h1>Bank Projection Tool</h1>
      <Link href="/dashboard">Go to Dashboard</Link>
    </div>
  );
}
