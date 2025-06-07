// pages/dashboard.js
import BalanceForm from '../components/BalanceForm';
import PaycheckForm from '../components/PaycheckForm';
import CardForm from '../components/CardForm';
import Projections from '../components/Projections';
import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
  // Simple state to force a refresh when any form saves
  const [refresh, setRefresh] = useState(0);
  const bump = () => setRefresh((v) => v + 1);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Your Dashboard</h2>
      </div>

      <div className={styles.dashboardGrid}>
        <BalanceForm onSave={bump} />
        <PaycheckForm onSave={bump} />
        <CardForm onSave={bump} />
        <Projections refresh={refresh} />
      </div>
    </div>
  );
}
