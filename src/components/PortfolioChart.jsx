import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { TrendingUp, BarChart2 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PortfolioChart({ selectedAsset }) {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('N/A');
  const [latency, setLatency] = useState(0);
  const chartRef = useRef(null);

  const { ticker, assetType } = selectedAsset || { ticker: 'AAPL', assetType: 'stock' };

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/market/history/${assetType}/${ticker}`);
        if (res.ok) {
          const data = await res.json();
          setHistoryData(data.history || []);
          setSource(data.source || 'Live API');
          setLatency(data.latencyMs || 0);
        }
      } catch (err) {
        console.error('Error fetching historical chart:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [ticker, assetType]);

  if (loading) {
    return (
      <div className="glass-card skeleton-loader" style={{ height: '390px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Streaming tick data indices...</p>
      </div>
    );
  }

  // Find if chart is overall bullish or bearish
  const isUp = historyData.length > 1 && historyData[historyData.length - 1].price >= historyData[0].price;
  const accentColor = isUp ? '#00e676' : '#ff1744';

  const chartData = {
    labels: historyData.map(h => {
      const date = new Date(h.time);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    }),
    datasets: [
      {
        fill: true,
        label: `${ticker} Price`,
        data: historyData.map(h => h.price),
        borderColor: accentColor,
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHitRadius: 10,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, isUp ? 'rgba(0, 230, 118, 0.18)' : 'rgba(255, 23, 68, 0.18)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          return gradient;
        },
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#12141c',
        titleColor: '#8f9cae',
        bodyColor: '#f5f6fa',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        titleFont: { family: 'Inter', size: 10 },
        bodyFont: { family: 'Inter', size: 12, weight: 'bold' },
        callbacks: {
          label: (context) => {
            return ` Price: $${parseFloat(context.parsed.y).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
          }
        }
      },
    },
    scales: {
      x: {
        display: false, // hide dense timestamp labels for minimalist style
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.03)',
          drawTicks: false,
        },
        ticks: {
          color: '#8f9cae',
          font: { family: 'Inter', size: 11 },
          callback: (value) => '$' + parseFloat(value).toLocaleString(),
        },
      },
    },
  };

  return (
    <div className="glass-card chart-container">
      <div className="chart-header">
        <div className="chart-title-area">
          <BarChart2 size={18} color="var(--accent-cyan)" />
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.2rem', fontWeight: 700 }}>
            {ticker} Tickers & Historical Flow
          </h2>
          <span className={`diagnostic-pill ${
            source.includes('Memory') ? 'pill-memory' :
            source.includes('Mongo') ? 'pill-db' :
            source.includes('Simulation') ? 'pill-sim' : 'pill-live'
          }`}>
            {source} ({latency}ms)
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <TrendingUp size={14} color={accentColor} />
          <span>{historyData.length} data points loaded</span>
        </div>
      </div>

      <div className="chart-canvas-wrapper">
        <Line ref={chartRef} data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
