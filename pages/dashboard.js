import { useState } from 'react';
import BalanceForm from '../components/BalanceForm';
import PaycheckForm from '../components/PaycheckForm';
import CardForm from '../components/CardForm';
import Projections from '../components/Projections';

export default function Dashboard() {
  const [refresh, setRefresh] = useState(0);
  const bumpRefresh = () => setRefresh((v) => v + 1);

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h1>Dashboard (Test User)</h1>
      <BalanceForm onSave={bumpRefresh} />
      <PaycheckForm onSave={bumpRefresh} />
      <CardForm onSave={bumpRefresh} />
      <Projections refresh={refresh} />
    </div>
  );
}
