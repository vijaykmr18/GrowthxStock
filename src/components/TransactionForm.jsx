import React, { useState } from 'react';
import { X, TrendingUp, DollarSign } from 'lucide-react';

export default function TransactionForm({ onClose, onTradeSuccess }) {
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('buy');
  const [assetType, setAssetType] = useState('stock');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Auto-fill names for popular assets to save user time
  const handleTickerChange = (val) => {
    const cleanVal = val.toUpperCase().trim();
    setTicker(cleanVal);

    const popularNames = {
      AAPL: 'Apple Inc.',
      TSLA: 'Tesla, Inc.',
      NVDA: 'NVIDIA Corporation',
      MSFT: 'Microsoft Corporation',
      AMZN: 'Amazon.com, Inc.',
      GOOGL: 'Alphabet Inc.',
      META: 'Meta Platforms, Inc.',
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      SOL: 'Solana',
      ADA: 'Cardano',
      DOGE: 'Dogecoin'
    };

    if (popularNames[cleanVal]) {
      setName(popularNames[cleanVal]);
      // Auto toggle assetType based on ticker
      if (['BTC', 'ETH', 'SOL', 'ADA', 'DOGE'].includes(cleanVal)) {
        setAssetType('crypto');
      } else {
        setAssetType('stock');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!ticker || !name || !quantity || !price) {
      setError('Please fill in all input fields.');
      return;
    }

    const qtyNum = parseFloat(quantity);
    const priceNum = parseFloat(price);

    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError('Quantity must be a positive number.');
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Price must be a positive number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/portfolio/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          name,
          type,
          assetType,
          quantity: qtyNum,
          price: priceNum,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit trade execution order.');
      }

      onTradeSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Record Trade execution</h3>
          <button onClick={onClose} className="close-btn">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 23, 68, 0.12)',
            border: '1px solid rgba(255, 23, 68, 0.3)',
            borderRadius: '8px',
            color: 'var(--accent-rose)',
            padding: '0.75rem',
            fontSize: '0.8rem',
            marginBottom: '1rem',
            lineHeight: '1.4'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Asset Class</label>
              <select 
                value={assetType} 
                onChange={(e) => setAssetType(e.target.value)}
                className="form-input"
                style={{ appearance: 'none', background: 'var(--bg-main)' }}
              >
                <option value="stock">Stock / Equity</option>
                <option value="crypto">Cryptocurrency</option>
              </select>
            </div>
            <div className="form-group">
              <label>Order Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="form-input"
                style={{ appearance: 'none', background: 'var(--bg-main)' }}
              >
                <option value="buy">BUY Order</option>
                <option value="sell">SELL Order</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Ticker Symbol (e.g. AAPL, BTC)</label>
              <input
                type="text"
                value={ticker}
                onChange={(e) => handleTickerChange(e.target.value)}
                className="form-input"
                placeholder="AAPL"
                required
              />
            </div>
            <div className="form-group">
              <label>Asset Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="Apple Inc."
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="form-input"
                placeholder="0.00"
                required
              />
            </div>
            <div className="form-group">
              <label>Price per Unit (USD)</label>
              <input
                type="number"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="form-input"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Executing Order...' : 'Submit Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
