import dotenv from 'dotenv';

dotenv.config();

/**
 * Generate AI-powered portfolio insights using OpenRouter
 */
export async function getPortfolioInsights(holdings, transactions, userMessage = null) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not defined in the environment variables.');
  }

  // Pre-process holdings into a neat summary for the LLM
  const holdingsSummary = holdings.map(h => (
    `- ${h.ticker} (${h.assetType}): Qty: ${h.shares}, Avg Cost: $${h.avgCost.toFixed(2)}, Current Price: $${h.currentPrice.toFixed(2)}, Value: $${h.totalValue.toFixed(2)}, Profit/Loss: $${h.totalProfit.toFixed(2)} (${h.profitPercent.toFixed(2)}%)`
  )).join('\n');

  const totalPortfolioValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
  const totalCost = holdings.reduce((sum, h) => sum + (h.shares * h.avgCost), 0);
  const totalProfit = totalPortfolioValue - totalCost;
  const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  const portfolioStats = `
Total Value: $${totalPortfolioValue.toFixed(2)}
Total Cost Basis: $${totalCost.toFixed(2)}
Overall Net Profit/Loss: $${totalProfit.toFixed(2)} (${totalProfitPercent.toFixed(2)}%)
Number of Assets: ${holdings.length}
  `;

  // Standard prompt when requesting a general health review
  let systemPrompt = `You are AetherAI, a top-tier quantitative financial analyst and wealth manager.
Analyze the user's asset allocation, cost basis, and paper profits.
You must analyze the diversification, suggest risk reductions, and flag over-exposure.

Response Guideline:
1. Provide a brief analysis of their current portfolio distribution (stocks vs. crypto, specific tickers).
2. Rate their 'Portfolio Risk Score' (from 1 to 100, where 100 is highly volatile/speculative).
3. Determine a 'Sentiment Index' (Bullish, Moderately Bullish, Neutral, Moderately Bearish, Bearish).
4. Provide exactly 3 actionable 'Advisor Recommendations' for reallocation or hedging.
5. Format your output in beautiful, highly structured Markdown. Use clean bullet points and tables where appropriate. Avoid wordiness.`;

  let prompt = `
Here is my current portfolio data:

${portfolioStats}

Current Holdings list:
${holdingsSummary}
  `;

  if (userMessage) {
    prompt += `\n\nUser Question/Instruction: "${userMessage}"\nPlease answer their specific question while keeping the context of their portfolio holdings in mind.`;
  } else {
    prompt += `\n\nPlease perform a general portfolio audit and suggest any reallocations or optimization opportunities.`;
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/vijaykmr18/IntroMyself',
        'X-Title': 'AetherStock AI Portfolio Tracker',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API responded with ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return {
      content: result.choices[0].message.content,
      model: result.model || 'google/gemini-2.5-flash',
      usage: result.usage || {},
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching insights from OpenRouter:', error);
    // Provide a beautiful mock backup response if the API fails
    return {
      content: `### ⚠️ AI Advisory Fallback Activation

We were unable to connect to OpenRouter due to network latency or rate-limiting. Here is a local heuristic-based audit of your portfolio:

#### Portfolio Observations
* **Diversification Audit**: You hold **${holdings.length} assets** totaling **$${totalPortfolioValue.toFixed(2)}**.
* **Crypto Exposure**: Crypto assets represent **${(holdings.filter(h => h.assetType === 'crypto').reduce((sum, h) => sum + h.totalValue, 0) / (totalPortfolioValue || 1) * 100).toFixed(1)}%** of your total assets. Over-exposure to digital currencies can heighten daily volatility.
* **Cost Efficiency**: Overall portfolio return is **${totalProfitPercent.toFixed(2)}%** with a profit/loss value of **$${totalProfit.toFixed(2)}**.

#### Simulated Analytics Metrics
* **Portfolio Risk Score**: **${totalPortfolioValue > 0 && holdings.some(h => h.assetType === 'crypto') ? 72 : 45}/100**
* **Sentiment Index**: **Moderately Bullish**

#### Tactical Advisor Recommendations
1. **Reduce Volatility Concentration**: If your cryptocurrency share exceeds 20%, lock in partial profits to re-invest in blue-chip equities or low-cost index ETFs.
2. **Review High cost Basis Assets**: Set trailing stops for holdings that are down significantly from average cost to mitigate downside risk.
3. **Build Cash Buffer**: Maintain 5-10% of portfolio value in money market accounts to execute trades during temporary stock index corrections.`,
      model: 'Local Analysis Engine (Fallback)',
      usage: {},
      timestamp: new Date().toISOString(),
      isFallback: true
    };
  }
}
export default { getPortfolioInsights };
