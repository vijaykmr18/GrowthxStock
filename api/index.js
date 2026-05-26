import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Warm up DB connection immediately
connectDB().catch((err) => {
  console.warn('Initial database connection warmup failed. Retries will occur inline during requests.', err.message);
});

// Mount routes
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/ai', aiRoutes);

// Base API verification endpoint
app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    project: 'AetherStock AI Portfolio Tracker',
    environment: process.env.VERCEL === '1' ? 'Vercel Serverless' : 'Local Node Server',
    timestamp: new Date().toISOString(),
  });
});

// Fallback/Catch-all error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Run local listener only when NOT deployed as a serverless function on Vercel
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`🚀 AetherStock server running locally on http://localhost:${PORT}`);
  });
}

export default app;
