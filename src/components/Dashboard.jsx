import React, { useState } from 'react';
import { PlusCircle, Search, TrendingUp, TrendingDown, RefreshCcw, DollarSign, Wallet, Percent, ShieldAlert } from 'lucide-react';

export default function Dashboard({ 
  holdingsData, 
  onAddTradeClick, 
  onResetPortfolio, 
  selectedAsset, 
  setSelectedAsset 
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const { holdings = [], totalValue = 0 } = holdingsData || {};

  // Calculate overall KPIs
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalProfit = totalValue - totalCost;
  const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  // Calculate weighted 24h change
  const weighted24hChange = holdings.reduce((sum, h) => {
    const weight = totalValue > 0 ? h.totalValue / totalValue : 0;
    return sum + (h.changePercent24h * weight);
  }, 0);

  // Filter holdings based on search
  const filteredHoldings = holdings.filter(h => 
    h.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="main-column">
      {/* KPIs Summary Cards */}
      <div className="kpi-container">
        <div className="kpi-card">
          <span className="kpi-title">
            <Wallet size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Portfolio Value
          </span>
          <span className="kpi-value">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className={`kpi-trend ${weighted24hChange >= 0 ? 'trend-up' : 'trend-down'}`}>
            {weighted24hChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {weighted24hChange >= 0 ? '+' : ''}{weighted24hChange.toFixed(2)}% (24h)
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-title">
            <DollarSign size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Invested capital
          </span>
          <span className="kpi-value">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cost Basis Index</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-title">
            <Percent size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Net Unrealized Return
          </span>
          <span className={`kpi-value ${totalProfit >= 0 ? 'trend-up' : 'trend-down'}`}>
            ${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`kpi-trend ${totalProfit >= 0 ? 'trend-up' : 'trend-down'}`}>
            {totalProfit >= 0 ? '+' : ''}{totalProfitPercent.toFixed(2)}% total
          </span>
        </div>
      </div>

      {/* Holdings Section */}
      <div className="glass-card">
        <div className="holdings-header">
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', fontWeight: 700 }}>Active Assets</h2>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Search filter */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter symbol..."
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-glass)',
                  padding: '0.4rem 0.6rem 0.4rem 1.8rem',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '0.8rem',
                  outline: 'none',
                  width: '130px'
                }}
              />
            </div>
            <button onClick={onAddTradeClick} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              <PlusCircle size={14} />
              Trade
            </button>
            <button onClick={onResetPortfolio} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} title="Reset Data">
              <RefreshCcw size={14} />
            </button>
          </div>
        </div>

        {holdings.length === 0 ? (
          <div className="empty-state">
            <ShieldAlert className="empty-icon" />
            <h3>Your Portfolio is Empty</h3>
            <p style={{ maxWidth: '300px', fontSize: '0.85rem' }}>
              Record your first buy order (e.g. BTC, AAPL, ETH) to track values, graph high-frequency candles, and consult AetherAI.
            </p>
            <button onClick={onAddTradeClick} className="btn btn-primary">
              <PlusCircle size={14} />
              Execute First Trade
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Balance</th>
                  <th>Avg Cost</th>
                  <th>Current Price</th>
                  <th>Net Returns</th>
                  <th>Total Value</th>
                  <th>Weight</th>
                </tr>
              </thead>
              <tbody>
                {filteredHoldings.map((h) => {
                  const isSelected = selectedAsset && selectedAsset.ticker === h.ticker;
                  const isProfit = h.totalProfit >= 0;

                  return (
                    <tr 
                      key={h.ticker} 
                      className={isSelected ? 'selected' : ''}
                      onClick={() => setSelectedAsset({ ticker: h.ticker, assetType: h.assetType })}
                    >
                      <td>
                        <div className="asset-badge">
                          <span className="asset-symbol">{h.ticker}</span>
                          <span className="asset-name">{h.name}</span>
                          <span className={`badge-tag ${h.assetType === 'stock' ? 'tag-stock' : 'tag-crypto'}`}>
                            {h.assetType}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{h.shares.toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Units</div>
                      </td>
                      <td>
                        <div>${h.avgCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>${h.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</div>
                        <div style={{ fontSize: '0.75rem', color: h.changePercent24h >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                          {h.changePercent24h >= 0 ? '+' : ''}{h.changePercent24h.toFixed(2)}%
                        </div>
                      </td>
                      <td>
                        <div style={{ color: isProfit ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 600 }}>
                          {isProfit ? '+' : ''}${h.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: isProfit ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                          {isProfit ? '+' : ''}{h.profitPercent.toFixed(2)}%
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          ${h.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{h.weight}%</div>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '0.3rem', overflow: 'hidden' }}>
                          <div style={{ width: `${h.weight}%`, height: '100%', background: 'var(--accent-cyan)' }}></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
