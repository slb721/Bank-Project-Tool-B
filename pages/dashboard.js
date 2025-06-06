// pages/dashboard.js
import BalanceForm from '../components/BalanceForm';
import PaycheckForm from '../components/PaycheckForm';
import CardForm from '../components/CardForm';
import Projections from '../components/Projections';

export default function Dashboard() {
  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h1>Dashboard (Test User)</h1>
      <BalanceForm />
      <PaycheckForm />
      <CardForm />
      <Projections />
    </div>
  );
}
