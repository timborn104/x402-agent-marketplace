// Demo Seller Agent - x402 Agent Marketplace
// An AI agent exposing paid capabilities via x402-stacks

import express from 'express';
import { paymentMiddleware } from '@x402/stacks-express';
import { microStxToStx } from '@x402/stacks';
import 'dotenv/config';

const app = express();
app.use(express.json());

// Configuration
const PORT = process.env.PORT ?? 3000;
const SELLER_ADDRESS = process.env.SELLER_ADDRESS ?? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const NETWORK_TYPE = (process.env.NETWORK ?? 'testnet') as 'mainnet' | 'testnet';

console.log('🤖 Demo Seller Agent starting...');
console.log(`   Address: ${SELLER_ADDRESS}`);
console.log(`   Network: ${NETWORK_TYPE}`);

// Apply x402 payment middleware
app.use(paymentMiddleware({
  'POST /summarize': { 
    price: '0.001', 
    description: 'Summarize text into a brief overview' 
  },
  'POST /translate': { 
    price: '0.001', 
    description: 'Translate text to another language' 
  },
  'POST /sentiment': { 
    price: '0.0005', 
    description: 'Analyze text sentiment' 
  },
}, {
  recipientAddress: SELLER_ADDRESS,
  network: { type: NETWORK_TYPE },
  settleImmediately: true,
}));

// Health check (free)
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', agent: 'demo-seller', version: '0.1.0' });
});

// Service discovery (free)
app.get('/services', (_req, res) => {
  res.json({
    agent: 'Demo Seller Agent',
    description: 'AI agent offering text processing services',
    network: NETWORK_TYPE,
    recipient: SELLER_ADDRESS,
    services: [
      {
        endpoint: 'POST /summarize',
        price: '0.001 STX',
        description: 'Summarize text into a brief overview',
        input: { text: 'string' },
        output: { summary: 'string' },
      },
      {
        endpoint: 'POST /translate',
        price: '0.001 STX',
        description: 'Translate text to another language',
        input: { text: 'string', targetLanguage: 'string' },
        output: { translation: 'string' },
      },
      {
        endpoint: 'POST /sentiment',
        price: '0.0005 STX',
        description: 'Analyze text sentiment',
        input: { text: 'string' },
        output: { sentiment: 'positive|negative|neutral', score: 'number' },
      },
    ],
  });
});

// Paid endpoint: Summarize
app.post('/summarize', (req, res) => {
  const { text } = req.body as { text?: string };
  
  if (!text) {
    res.status(400).json({ error: 'Missing "text" field' });
    return;
  }

  // Simple summarization: first 100 chars + word count
  const words = text.split(/\s+/);
  const summary = text.length > 100 
    ? text.slice(0, 100) + '...' 
    : text;
  
  const payment = req.x402Payment;
  console.log(`📝 Summarized ${words.length} words. Paid: ${payment?.txId ?? 'pending'}`);

  res.json({
    summary,
    wordCount: words.length,
    originalLength: text.length,
    payment: payment ? {
      txId: payment.txId,
      amount: microStxToStx(payment.amount) + ' STX',
    } : undefined,
  });
});

// Paid endpoint: Translate
app.post('/translate', (req, res) => {
  const { text, targetLanguage = 'Spanish' } = req.body as { 
    text?: string; 
    targetLanguage?: string;
  };
  
  if (!text) {
    res.status(400).json({ error: 'Missing "text" field' });
    return;
  }

  // Mock translation (in real app, would call translation API)
  const translations: Record<string, string> = {
    'Hello': 'Hola',
    'World': 'Mundo',
    'Agent': 'Agente',
    'Payment': 'Pago',
  };
  
  // Simple word-by-word mock translation
  const translation = text.split(/\s+/)
    .map(word => translations[word] ?? `[${word}]`)
    .join(' ');

  const payment = req.x402Payment;
  console.log(`🌍 Translated to ${targetLanguage}. Paid: ${payment?.txId ?? 'pending'}`);

  res.json({
    translation,
    sourceLanguage: 'English',
    targetLanguage,
    payment: payment ? {
      txId: payment.txId,
      amount: microStxToStx(payment.amount) + ' STX',
    } : undefined,
  });
});

// Paid endpoint: Sentiment Analysis
app.post('/sentiment', (req, res) => {
  const { text } = req.body as { text?: string };
  
  if (!text) {
    res.status(400).json({ error: 'Missing "text" field' });
    return;
  }

  // Simple sentiment analysis based on keywords
  const positiveWords = ['good', 'great', 'excellent', 'happy', 'love', 'amazing'];
  const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'sad', 'angry'];
  
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;
  
  for (const word of words) {
    if (positiveWords.includes(word)) score += 1;
    if (negativeWords.includes(word)) score -= 1;
  }
  
  const sentiment = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';

  const payment = req.x402Payment;
  console.log(`😊 Sentiment: ${sentiment} (${score}). Paid: ${payment?.txId ?? 'pending'}`);

  res.json({
    sentiment,
    score: score / words.length, // Normalized score
    wordCount: words.length,
    payment: payment ? {
      txId: payment.txId,
      amount: microStxToStx(payment.amount) + ' STX',
    } : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Demo Seller Agent running on http://localhost:${PORT}`);
  console.log('   Available endpoints:');
  console.log('   - GET  /health    (free)');
  console.log('   - GET  /services  (free)');
  console.log('   - POST /summarize (0.001 STX)');
  console.log('   - POST /translate (0.001 STX)');
  console.log('   - POST /sentiment (0.0005 STX)');
  console.log('\n💡 Waiting for payments...\n');
});
