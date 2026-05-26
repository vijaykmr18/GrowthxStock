import express from 'express';
import Transaction from '../models/Transaction.js';
import { getAssetQuote } from '../services/marketService.js';
import { getPortfolioInsights } from '../services/aiService.js';
import { connectDB } from '../config/db.js';

const router = express.Router();

router.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

/**
 * POST: Get portfolio audit and suggestions, or chat with AI advisor
 */
router.post('/audit', async (req, res) => {
  const { message } = req.body;

  try {
    // 1. Gather and aggregate holdings
    const transactions = await Transaction.find().sort({ date: 1 });
    const holdingsMap = {};

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
        holding.shares = Math.max(0, holding.shares - t.quantity);
      }
    }

    const activeHoldings = Object.values(holdingsMap).filter(h => h.shares > 0.00001);

    // 2. Resolve current prices in parallel with caching (to construct actual valuations)
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
            totalValue: parseFloat(totalValue.toFixed(2)),
            totalCost: parseFloat(totalCost.toFixed(2)),
            totalProfit: parseFloat(totalProfit.toFixed(2)),
            profitPercent: parseFloat(profitPercent.toFixed(2)),
          };
        } catch (quoteErr) {
          return {
            ...holding,
            currentPrice: holding.avgCost,
            totalValue: parseFloat((holding.shares * holding.avgCost).toFixed(2)),
            totalCost: parseFloat((holding.shares * holding.avgCost).toFixed(2)),
            totalProfit: 0,
            profitPercent: 0,
          };
        }
      })
    );

    // 3. Call AI Advisor Service
    const insights = await getPortfolioInsights(holdingsWithPrices, transactions, message);
    
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: 'AI Portfolio Audit failed', details: error.message });
  }
});

export default router;
