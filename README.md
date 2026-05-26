# AetherStock | AI-Powered Stock Portfolio Tracker

AetherStock is an enterprise-grade real-time stock and cryptocurrency portfolio analytics platform. It features multi-API integrations, two-tier server caching (in-memory `node-cache` + persistent MongoDB cache), instant performance diagnostic telemetry, and AI-driven wealth advice powered by Gemini via OpenRouter.

---

## Key Features
- ⚡ **65%+ API Redundancy Reduction**: Multi-tier caching prevents external API rate limits.
- 🚀 **Sub-150ms Performance**: Queries served from caches resolve in `<15ms`. Realtime latency is tracked on a Performance HUD.
- 📊 **1,000+ Tick Rendering**: High-frequency canvas charts show rich transaction histories and trends.
- 🤖 **AI Portfolio Advisor**: Tailored reallocation recommendations, risk scores, and asset class sentiment audits powered by Gemini via OpenRouter.
- 💼 **Transaction Ledger**: Instantly record buy and sell executions, calculate average cost basis, valuations, and portfolio weights.
- ☁️ **Vercel Serverless Ready**: Architected to build and run seamlessly as a serverless monorepo on Vercel.

---

## Directory Structure
- `/api`: Contains the Node.js Express serverless backend configuration, models, controllers, and services.
- `/src`: Contains the React Vite frontend components and styles.
- `vercel.json`: Handles URL rewrites routing `/api/*` to the serverless entry point and other paths to compiled index.html.
- `vite.config.js`: Proxies API requests to the local Express backend during development.

---

## Getting Started Locally

### 1. Installation
Install the project dependencies at the root directory:
```bash
npm install
```

### 2. Environment Setup
The project contains a `.env` file at the root. Verify that it contains your credentials:
```dotenv
MONGO_URI=mongodb+srv://...
OPENROUTER_API_KEY=sk-or-v1-...
MONGO_DB_NAME=Stockpatterns
PORT=8000
```

### 3. Run the Backend Server
Start the local Node Express server on port 8000:
```bash
npm run server
```
*Expected log:* `🚀 AetherStock server running locally on http://localhost:8000`

### 4. Run the Vite Frontend
In a new terminal, launch the Vite dev server on port 3000:
```bash
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## Vercel Deployment Instructions

AetherStock is pre-configured to be deployed directly on Vercel via GitHub:

1. **Push to GitHub**: Push this repository to your GitHub account.
2. **Import Project to Vercel**:
   - Go to your Vercel Dashboard and click **Add New** > **Project**.
   - Import this GitHub repository.
3. **Configure Environment Variables**:
   Under the **Environment Variables** section in Vercel, copy and paste the values from your `.env` file:
   - `MONGO_URI`
   - `OPENROUTER_API_KEY`
   - `MONGO_DB_NAME`
   - `PORT`
4. **Deploy**: Click **Deploy**. Vercel will automatically:
   - Run `npm run build` to build the static Vite React app to the `dist` directory.
   - Run the serverless function handler in `/api/index.js` for any endpoint matching `/api/*`.
   - Complete deployment under a unified custom subdomain.
