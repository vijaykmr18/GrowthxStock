import express from 'express';
import { getAssetQuote, getAssetHistory, telemetry } from '../services/marketService.js';

const router = express.Router();

/**
 * GET: Retrieve quote for a single asset
 */
router.get('/quote/:type/:ticker', async (req, res) => {
  const { type, ticker } = req.params;
  
  if (!['stock', 'crypto'].includes(type.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid asset type. Must be "stock" or "crypto".' });
  }

  try {
    const result = await getAssetQuote(ticker, type.toLowerCase());
    res.json({
      quote: result.data,
      source: result.source,
      latencyMs: result.latencyMs,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve asset quote', details: error.message });
  }
});

/**
 * GET: Retrieve historical charts for an asset (supplying 1,000+ data points)
 */
router.get('/history/:type/:ticker', async (req, res) => {
  const { type, ticker } = req.params;
  
  if (!['stock', 'crypto'].includes(type.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid asset type. Must be "stock" or "crypto".' });
  }

  try {
    const result = await getAssetHistory(ticker, type.toLowerCase());
    res.json({
      history: result.data,
      source: result.source,
      latencyMs: result.latencyMs,
      dataPoints: result.data.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve asset history', details: error.message });
  }
});

/**
 * GET: Caching diagnostics telemetry
 */
router.get('/telemetry', (req, res) => {
  const totalHits = telemetry.memoryHits + telemetry.dbHits;
  const totalCalls = totalHits + telemetry.apiCalls + telemetry.mockCalls;
  const savingsPercent = totalCalls > 0 ? (totalHits / totalCalls) * 100 : 0;
  
  res.json({
    memoryHits: telemetry.memoryHits,
    dbHits: telemetry.dbHits,
    apiCalls: telemetry.apiCalls,
    mockCalls: telemetry.mockCalls,
    totalSaved: totalHits,
    totalRequests: totalCalls,
    savingsPercent: parseFloat(savingsPercent.toFixed(1)),
    timestamp: new Date().toISOString()
  });
});

export default router;
