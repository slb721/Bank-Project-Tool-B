// components/ProjectionChart.js
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export default function ProjectionChart({ labels, dataPoints }) {
  const data = {
    labels,
    datasets: [
      {
        label: 'Balance Over Time',
        data: dataPoints,
        fill: false,
        borderColor: '#4caf50',
        tension: 0.3
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return <Line data={data} options={options} />;
}
