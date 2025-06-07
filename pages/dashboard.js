// pages/dashboard.js
import { useState } from 'react';
import BalanceForm from '../components/BalanceForm';
import PaycheckForm from '../components/PaycheckForm';
import CardForm from '../components/CardForm';
import Projections from '../components/Projections';
import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
  const [refresh, setRefresh] = useState(0);
  const bump = () => setRefresh((v) => v + 1);

  return (
    <div className={styles.container}>
      <h2>Your Dashboard</h2>
      <BalanceForm onSave={bump} />
      <PaycheckForm onSave={bump} />
      <CardForm onSave={bump} />
      <Projections refresh={refresh} />
    </div>
  );
}
