import express from 'express';
import Transaction from '../models/Transaction.js';
import { getAssetQuote } from '../services/marketService.js';
import { connectDB } from '../config/db.js';

const router = express.Router();

// Helper to ensure database is connected
router.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

/**
 * GET: Retrieve raw transaction history
 */
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve transactions', details: error.message });
  }
});

/**
 * POST: Create a new transaction (Buy/Sell)
 */
router.post('/trade', async (req, res) => {
  const { ticker, name, type, assetType, quantity, price } = req.body;

  if (!ticker || !name || !type || !assetType || !quantity || !price) {
    return res.status(400).json({ error: 'All trade fields are required.' });
  }

  try {
    // If it's a SELL, verify user has enough shares
    if (type === 'sell') {
      const transactions = await Transaction.find({ ticker: ticker.toUpperCase() });
      let currentShares = 0;
      for (const t of transactions) {
        if (t.type === 'buy') currentShares += t.quantity;
        else if (t.type === 'sell') currentShares -= t.quantity;
      }

      if (currentShares < quantity) {
        return res.status(400).json({
          error: `Insufficient shares for sell order. You own ${currentShares.toFixed(4)} shares of ${ticker.toUpperCase()} but attempted to sell ${quantity}.`
        });
      }
    }

    const transaction = new Transaction({
      ticker: ticker.toUpperCase(),
      name,
      type,
      assetType,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to record transaction', details: error.message });
  }
});

/**
 * DELETE: Clear all transactions (for starting fresh)
 */
router.delete('/reset', async (req, res) => {
  try {
    await Transaction.deleteMany({});
    res.json({ message: 'Portfolio reset successfully. All transactions deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset portfolio', details: error.message });
  }
});

/**
 * GET: Retrieve aggregated holdings with live prices and valuations
 */
router.get('/holdings', async (req, res) => {
  const startTime = Date.now();
  try {
    const transactions = await Transaction.find().sort({ date: 1 }); // Sort chronologically to compute cost basis
    
    const holdingsMap = {};

    // 1. Calculate holding quantities and cost basis
    for (const t of transactions) {
      const ticker = t.ticker.toUpperCase();
      if (!holdingsMap[ticker]) {
        holdingsMap[ticker] = {
          ticker,
          name: t.name,
          assetType: t.assetType,
          shares: 0,
          avgCost: 0,
        };
      }

      const holding = holdingsMap[ticker];
      if (t.type === 'buy') {
        const newShares = holding.shares + t.quantity;
        const newTotalCost = (holding.shares * holding.avgCost) + (t.quantity * t.price);
        holding.shares = newShares;
        holding.avgCost = newShares > 0 ? newTotalCost / newShares : 0;
      } else if (t.type === 'sell') {
        const newShares = Math.max(0, holding.shares - t.quantity);
        holding.shares = newShares;
        // Cost basis per share remains the same on sales
      }
    }

    // Filter out fully liquidated assets
    const activeHoldings = Object.values(holdingsMap).filter(h => h.shares > 0.00001);

    // 2. Fetch current prices in parallel with caching (high speed!)
    const holdingsWithPrices = await Promise.all(
      activeHoldings.map(async (holding) => {
        try {
          const quoteResult = await getAssetQuote(holding.ticker, holding.assetType);
          const liveData = quoteResult.data;
          
          const currentPrice = liveData.price;
          const totalValue = holding.shares * currentPrice;
          const totalCost = holding.shares * holding.avgCost;
          const totalProfit = totalValue - totalCost;
          const profitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

          return {
            ...holding,
            currentPrice,
            changePercent24h: liveData.changePercent,
            change24h: liveData.change,
            totalValue: parseFloat(totalValue.toFixed(2)),
            totalCost: parseFloat(totalCost.toFixed(2)),
            totalProfit: parseFloat(totalProfit.toFixed(2)),
            profitPercent: parseFloat(profitPercent.toFixed(2)),
            source: quoteResult.source,
            quoteLatencyMs: quoteResult.latencyMs,
          };
        } catch (quoteErr) {
          console.error(`Failed to get quote for ${holding.ticker}:`, quoteErr.message);
          // Fallback static metrics
          const currentPrice = holding.avgCost;
          return {
            ...holding,
            currentPrice,
            changePercent24h: 0,
            change24h: 0,
            totalValue: parseFloat((holding.shares * currentPrice).toFixed(2)),
            totalCost: parseFloat((holding.shares * holding.avgCost).toFixed(2)),
            totalProfit: 0,
            profitPercent: 0,
            source: 'Error Fallback',
            quoteLatencyMs: 0,
          };
        }
      })
    );

    // 3. Compute weights
    const totalPortfolioValue = holdingsWithPrices.reduce((sum, h) => sum + h.totalValue, 0);
    const holdingsWithWeights = holdingsWithPrices.map(h => ({
      ...h,
      weight: totalPortfolioValue > 0 ? parseFloat(((h.totalValue / totalPortfolioValue) * 100).toFixed(2)) : 0
    }));

    // Sort by largest value first
    holdingsWithWeights.sort((a, b) => b.totalValue - a.totalValue);

    res.json({
      holdings: holdingsWithWeights,
      totalValue: parseFloat(totalPortfolioValue.toFixed(2)),
      latencyMs: Date.now() - startTime,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process holdings', details: error.message });
  }
});

export default router;
