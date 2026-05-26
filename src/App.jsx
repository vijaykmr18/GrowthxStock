import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, RefreshCw, Layers } from 'lucide-react';
import Dashboard from './components/Dashboard.jsx';
import PortfolioChart from './components/PortfolioChart.jsx';
import AssetDistribution from './components/AssetDistribution.jsx';
import AIAdvisor from './components/AIAdvisor.jsx';
import PerformanceMetrics from './components/PerformanceMetrics.jsx';
import TransactionForm from './components/TransactionForm.jsx';
import './App.css';

export default function App() {
  const [holdingsData, setHoldingsData] = useState({ holdings: [], totalValue: 0 });
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastLatency, setLastLatency] = useState(0);
  const [seeding, setSeeding] = useState(false);

  // Fetch aggregated holdings
  const fetchHoldings = async () => {
    const start = Date.now();
    try {
      const res = await fetch('/api/portfolio/holdings');
      if (res.ok) {
        const data = await res.json();
        setHoldingsData(data);
        setLastLatency(Date.now() - start);

        // Auto select first holding if none is currently selected
        if (data.holdings && data.holdings.length > 0 && !selectedAsset) {
          setSelectedAsset({
            ticker: data.holdings[0].ticker,
            assetType: data.holdings[0].assetType
          });
        }
      }
    } catch (err) {
      console.error('Error fetching holdings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoldings();
  }, [refreshCounter]);

  // Reset portfolio
  const handleResetPortfolio = async () => {
    if (!window.confirm('Are you sure you want to clear your entire portfolio transactions log?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/portfolio/reset', { method: 'DELETE' });
      if (res.ok) {
        setSelectedAsset(null);
        setRefreshCounter(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error resetting portfolio:', err);
    }
  };

  // Seed portfolio with demo data
  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const demoTrades = [
        { ticker: 'AAPL', name: 'Apple Inc.', type: 'buy', assetType: 'stock', quantity: 25, price: 181.25 },
        { ticker: 'BTC', name: 'Bitcoin', type: 'buy', assetType: 'crypto', quantity: 0.85, price: 61400.00 },
        { ticker: 'NVDA', name: 'NVIDIA Corporation', type: 'buy', assetType: 'stock', quantity: 15, price: 885.50 }
      ];

      for (const trade of demoTrades) {
        await fetch('/api/portfolio/trade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trade),
        });
      }

      setRefreshCounter(prev => prev + 1);
    } catch (err) {
      console.error('Seeding failed:', err);
    } finally {
      setSeeding(false);
    }
  };

  const handleTradeSuccess = () => {
    setRefreshCounter(prev => prev + 1);
  };

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <header className="app-header">
        <div className="logo-container">
          <Layers size={24} color="var(--accent-cyan)" />
          <h1 className="logo-text">AetherStock</h1>
        </div>
        <div className="header-actions">
          {holdingsData.holdings.length === 0 && (
            <button 
              onClick={handleSeedDemo} 
              className="btn btn-secondary" 
              style={{ color: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)' }}
              disabled={seeding}
            >
              {seeding ? 'Seeding...' : 'Seed Demo Data'}
            </button>
          )}
          <button onClick={() => setShowTradeModal(true)} className="btn btn-primary">
            Record Transaction
          </button>
        </div>
      </header>

      {/* Main Performance diagnostics bar */}
      <PerformanceMetrics lastQueryLatencyMs={lastLatency} />

      {/* Dashboard Body Grid */}
      <div className="dashboard-grid">
        {/* Left column: Holdings metrics, Lists, Charts */}
        <div className="main-column">
          {loading && holdingsData.holdings.length === 0 ? (
            <div className="glass-card skeleton-loader" style={{ height: '300px' }}></div>
          ) : (
            <Dashboard 
              holdingsData={holdingsData}
              onAddTradeClick={() => setShowTradeModal(true)}
              onResetPortfolio={handleResetPortfolio}
              selectedAsset={selectedAsset}
              setSelectedAsset={setSelectedAsset}
            />
          )}

          {/* Render price chart for currently selected asset */}
          {selectedAsset && <PortfolioChart selectedAsset={selectedAsset} />}
        </div>

        {/* Right column: Distribution wheel, AI advisor */}
        <div className="side-column">
          <AssetDistribution 
            holdings={holdingsData.holdings} 
            totalValue={holdingsData.totalValue} 
          />
          
          <AIAdvisor 
            holdings={holdingsData.holdings} 
            triggerRefresh={refreshCounter}
          />
        </div>
      </div>

      {/* Overlay Trade Form Modal */}
      {showTradeModal && (
        <TransactionForm 
          onClose={() => setShowTradeModal(false)} 
          onTradeSuccess={handleTradeSuccess} 
        />
      )}
    </div>
  );
}
