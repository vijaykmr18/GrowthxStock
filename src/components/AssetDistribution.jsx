import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { PieChart } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AssetDistribution({ holdings, totalValue }) {
  if (!holdings || holdings.length === 0) {
    return (
      <div className="glass-card" style={{ height: '335px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <PieChart size={36} style={{ opacity: 0.2 }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No allocation data available</p>
      </div>
    );
  }

  // Pick colors from design token palette
  const colors = [
    '#00e5ff', // Cyan
    '#8e2de2', // Purple
    '#00e676', // Emerald
    '#ff1744', // Rose
    '#ffea00', // Yellow
    '#ff9100', // Orange
    '#d500f9', // Magenta
    '#2979ff', // Royal Blue
  ];

  const chartData = {
    labels: holdings.map(h => h.ticker),
    datasets: [
      {
        data: holdings.map(h => h.totalValue),
        backgroundColor: holdings.map((_, i) => colors[i % colors.length]),
        borderColor: 'var(--bg-card)',
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#f5f6fa',
          font: {
            family: 'Inter',
            size: 11,
          },
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: '#12141c',
        titleColor: '#8f9cae',
        bodyColor: '#f5f6fa',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const val = context.parsed;
            const pct = ((val / totalValue) * 100).toFixed(1);
            return ` ${context.label}: $${val.toLocaleString()} (${pct}%)`;
          },
        },
      },
    },
    cutout: '65%',
  };

  return (
    <div className="glass-card" style={{ height: '335px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <PieChart size={16} color="var(--accent-purple)" />
        Asset Allocation Matrix
      </h3>

      <div style={{ position: 'relative', flexGrow: 1, height: '80%' }}>
        <Doughnut data={chartData} options={chartOptions} />
        
        {/* Center Text displaying total holdings value */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '34%', // Offset a bit to left to balance legend on right
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Portfolio Value
          </span>
          <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', fontWeight: 800, color: 'white', marginTop: '0.2rem' }}>
            ${Math.round(totalValue).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
