// components/Projections.js
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import styles from '../styles/Dashboard.module.css';

// 1) register the controllers & elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Projections() {
  // 2) minimal test data
  const data = {
    labels: ['Jun 1', 'Jun 8', 'Jun 15'],
    datasets: [
      {
        label: 'Balance',
        data: [1000, 1200, 1100],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.2)',
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: { title: { display: true, text: 'Balance ($)' } },
    },
  };

  return (
    <div className={styles.card}>
      <h3>Projection Chart</h3>
      <div style={{ height: 300 }}>
        <Chart type="line" data={data} options={options} />
      </div>
    </div>
  );
}
