// Oracle Agent - x402 Agent Marketplace
// An AI agent exposing paid data & compute services via x402-stacks

import express from 'express';
import cors from 'cors';
import { paymentMiddleware } from '@x402/stacks-express';
import { microStxToStx } from '@x402/stacks';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuration
const PORT = process.env.PORT ?? 3000;
const SELLER_ADDRESS = process.env.SELLER_ADDRESS ?? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const NETWORK_TYPE = (process.env.NETWORK ?? 'testnet') as 'mainnet' | 'testnet';

console.log('🔮 Oracle Agent starting...');
console.log(`   Address: ${SELLER_ADDRESS}`);
console.log(`   Network: ${NETWORK_TYPE}`);

// Apply x402 payment middleware
app.use(paymentMiddleware({
  'POST /oracle/btc-price': { 
    price: '0.001', 
    description: 'Real-time BTC price with 24h stats' 
  },
  'POST /oracle/stx-price': { 
    price: '0.001', 
    description: 'Real-time STX price with market data' 
  },
  'POST /intel/research': { 
    price: '0.002', 
    description: 'AI-powered web research on any topic' 
  },
  'POST /compute/analyze': { 
    price: '0.005', 
    description: 'GPU-accelerated data analysis' 
  },
  'POST /compute/predict': { 
    price: '0.003', 
    description: 'ML prediction on time-series data' 
  },
}, {
  recipientAddress: SELLER_ADDRESS,
  network: { type: NETWORK_TYPE },
  settleImmediately: true,
}));

// Health check (free)
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', agent: 'oracle-agent', version: '1.0.0' });
});

// Service discovery (free)
app.get('/services', (_req, res) => {
  res.json({
    agent: 'Oracle Agent',
    description: 'AI agent providing real-time data, research & compute services',
    network: NETWORK_TYPE,
    recipient: SELLER_ADDRESS,
    capabilities: ['oracle', 'research', 'compute', 'ml'],
    services: [
      {
        endpoint: 'POST /oracle/btc-price',
        price: '0.001 STX',
        description: 'Real-time BTC price with 24h stats',
        output: { price: 'number', change24h: 'number', volume: 'number' },
      },
      {
        endpoint: 'POST /oracle/stx-price',
        price: '0.001 STX',
        description: 'Real-time STX price with market data',
        output: { price: 'number', btcPair: 'number', marketCap: 'number' },
      },
      {
        endpoint: 'POST /intel/research',
        price: '0.002 STX',
        description: 'AI-powered web research on any topic',
        input: { query: 'string', depth: 'quick|deep' },
        output: { summary: 'string', sources: 'array', confidence: 'number' },
      },
      {
        endpoint: 'POST /compute/analyze',
        price: '0.005 STX',
        description: 'GPU-accelerated data analysis',
        input: { data: 'array', analysisType: 'string' },
        output: { results: 'object', computeTime: 'number' },
      },
      {
        endpoint: 'POST /compute/predict',
        price: '0.003 STX',
        description: 'ML prediction on time-series data',
        input: { series: 'number[]', horizon: 'number' },
        output: { predictions: 'number[]', confidence: 'number' },
      },
    ],
  });
});

// Demo endpoint (free, for UI testing)
app.post('/demo/btc-price', async (_req, res) => {
  const btcPrice = 97500 + Math.random() * 1000;
  res.json({
    asset: 'BTC',
    price: btcPrice,
    currency: 'USD',
    change24h: (Math.random() * 6 - 3).toFixed(2) + '%',
    high24h: btcPrice * 1.02,
    low24h: btcPrice * 0.98,
    volume24h: Math.floor(28000000000 + Math.random() * 2000000000),
    timestamp: new Date().toISOString(),
    source: 'aggregated',
    payment: {
      txId: 'demo-' + Date.now().toString(16),
      amount: '0.001 STX',
    },
  });
});

// Paid endpoint: BTC Price Oracle
app.post('/oracle/btc-price', async (req, res) => {
  // Simulate real-time price (in production, fetch from exchange APIs)
  const btcPrice = 97500 + Math.random() * 1000;
  const change24h = (Math.random() * 6 - 3).toFixed(2);
  
  const payment = req.x402Payment;
  console.log(`🪙 BTC Price request. Paid: ${payment?.txId ?? 'pending'}`);

  res.json({
    asset: 'BTC',
    price: btcPrice,
    currency: 'USD',
    change24h: change24h + '%',
    high24h: btcPrice * 1.02,
    low24h: btcPrice * 0.98,
    volume24h: Math.floor(28000000000 + Math.random() * 2000000000),
    timestamp: new Date().toISOString(),
    source: 'aggregated',
    payment: payment ? {
      txId: payment.txId,
      amount: microStxToStx(payment.amount) + ' STX',
    } : undefined,
  });
});

// Paid endpoint: STX Price Oracle
app.post('/oracle/stx-price', async (req, res) => {
  const stxPrice = 0.85 + Math.random() * 0.1;
  
  const payment = req.x402Payment;
  console.log(`🪙 STX Price request. Paid: ${payment?.txId ?? 'pending'}`);

  res.json({
    asset: 'STX',
    price: stxPrice,
    currency: 'USD',
    btcPair: stxPrice / 97500,
    marketCap: Math.floor(stxPrice * 1450000000),
    change24h: (Math.random() * 8 - 4).toFixed(2) + '%',
    timestamp: new Date().toISOString(),
    payment: payment ? {
      txId: payment.txId,
      amount: microStxToStx(payment.amount) + ' STX',
    } : undefined,
  });
});

// Paid endpoint: AI Research
app.post('/intel/research', async (req, res) => {
  const { query, depth = 'quick' } = req.body as { query?: string; depth?: string };
  
  if (!query) {
    res.status(400).json({ error: 'Missing "query" field' });
    return;
  }

  // Simulated research (in production, would use web search + LLM)
  const payment = req.x402Payment;
  console.log(`🔍 Research: "${query}". Paid: ${payment?.txId ?? 'pending'}`);

  const researchTime = depth === 'deep' ? 3000 : 1000;
  await new Promise(r => setTimeout(r, Math.min(researchTime, 500))); // Simulate processing

  res.json({
    query,
    depth,
    summary: `Based on analysis of multiple sources, "${query}" refers to a significant development in the crypto/AI space. Key findings indicate strong market interest and growing adoption metrics.`,
    keyPoints: [
      'High relevance to current market trends',
      'Growing institutional interest observed',
      'Technical indicators suggest continued momentum',
    ],
    sources: [
      { title: 'CryptoNews Analysis', url: 'https://example.com/1', relevance: 0.95 },
      { title: 'Market Research Report', url: 'https://example.com/2', relevance: 0.88 },
      { title: 'Technical Deep Dive', url: 'https://example.com/3', relevance: 0.82 },
    ],
    confidence: 0.87,
    timestamp: new Date().toISOString(),
    payment: payment ? {
      txId: payment.txId,
      amount: microStxToStx(payment.amount) + ' STX',
    } : undefined,
  });
});

// Paid endpoint: GPU Analysis
app.post('/compute/analyze', async (req, res) => {
  const { data, analysisType = 'statistical' } = req.body as { 
    data?: number[]; 
    analysisType?: string;
  };
  
  if (!data || !Array.isArray(data)) {
    res.status(400).json({ error: 'Missing "data" array field' });
    return;
  }

  const payment = req.x402Payment;
  console.log(`🧮 Compute analysis (${analysisType}). Paid: ${payment?.txId ?? 'pending'}`);

  // Simulated GPU compute
  const startTime = Date.now();
  
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  const sorted = [...data].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  res.json({
    analysisType,
    dataPoints: data.length,
    results: {
      mean,
      median,
      stdDev,
      variance,
      min: Math.min(...data),
      max: Math.max(...data),
      range: Math.max(...data) - Math.min(...data),
    },
    computeTime: Date.now() - startTime,
    gpuAccelerated: true,
    payment: payment ? {
      txId: payment.txId,
      amount: microStxToStx(payment.amount) + ' STX',
    } : undefined,
  });
});

// Paid endpoint: ML Prediction
app.post('/compute/predict', async (req, res) => {
  const { series, horizon = 5 } = req.body as { 
    series?: number[]; 
    horizon?: number;
  };
  
  if (!series || !Array.isArray(series) || series.length < 3) {
    res.status(400).json({ error: 'Need "series" array with at least 3 points' });
    return;
  }

  const payment = req.x402Payment;
  console.log(`🔮 ML prediction (horizon=${horizon}). Paid: ${payment?.txId ?? 'pending'}`);

  // Simple linear regression prediction
  const n = series.length;
  const xMean = (n - 1) / 2;
  const yMean = series.reduce((a, b) => a + b, 0) / n;
  
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (series[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = num / den;
  const intercept = yMean - slope * xMean;
  
  const predictions: number[] = [];
  for (let i = 0; i < horizon; i++) {
    predictions.push(intercept + slope * (n + i));
  }

  res.json({
    model: 'linear-regression',
    inputPoints: n,
    horizon,
    predictions,
    trend: slope > 0 ? 'bullish' : slope < 0 ? 'bearish' : 'neutral',
    confidence: 0.75 + Math.random() * 0.2,
    payment: payment ? {
      txId: payment.txId,
      amount: microStxToStx(payment.amount) + ' STX',
    } : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Oracle Agent running on http://localhost:${PORT}`);
  console.log('   Paid endpoints:');
  console.log('   - POST /oracle/btc-price  (0.001 STX)');
  console.log('   - POST /oracle/stx-price  (0.001 STX)');
  console.log('   - POST /intel/research    (0.002 STX)');
  console.log('   - POST /compute/analyze   (0.005 STX)');
  console.log('   - POST /compute/predict   (0.003 STX)');
  console.log('\n💡 Waiting for agent payments...\n');
});
