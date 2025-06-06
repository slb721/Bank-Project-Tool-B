// pages/index.js
import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Bank Projection Tool</h1>
      <p><Link href="/dashboard">Go to Dashboard</Link></p>
    </div>
  );
}
