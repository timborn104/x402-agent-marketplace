// Demo Buyer Agent - x402 Agent Marketplace
// An AI agent that discovers and pays for services from other agents

import { createX402Fetch, checkWalletBalance, PaymentInfo } from '@x402/stacks-fetch';
import { microStxToStx, getWalletAddress } from '@x402/stacks';
import 'dotenv/config';

// Configuration
const SELLER_URL = process.env.SELLER_URL ?? 'http://localhost:3000';
const BUYER_PRIVATE_KEY = process.env.BUYER_PRIVATE_KEY ?? '';
const NETWORK_TYPE = (process.env.NETWORK ?? 'testnet') as 'mainnet' | 'testnet';

if (!BUYER_PRIVATE_KEY) {
  console.error('❌ BUYER_PRIVATE_KEY not set in environment');
  process.exit(1);
}

// Track payments made
const paymentsMade: PaymentInfo[] = [];

// Create x402-enabled fetch
const x402Fetch = createX402Fetch({
  wallet: { privateKey: BUYER_PRIVATE_KEY },
  network: { type: NETWORK_TYPE },
  maxAutoPayAmount: '5000000', // Max 5 STX per request
  onPayment: (info) => {
    paymentsMade.push(info);
    console.log(`💸 Paid ${microStxToStx(info.amount)} STX to ${info.recipient.slice(0, 10)}...`);
    if (info.txId) {
      console.log(`   TX: ${info.txId}`);
    }
  },
});

async function main() {
  console.log('🤖 Demo Buyer Agent starting...\n');

  // Get buyer address
  const buyerAddress = getWalletAddress(BUYER_PRIVATE_KEY, NETWORK_TYPE);
  console.log(`Buyer Address: ${buyerAddress}`);
  console.log(`Seller URL: ${SELLER_URL}`);
  console.log(`Network: ${NETWORK_TYPE}\n`);

  // Check balance
  try {
    const balance = await checkWalletBalance({
      wallet: { privateKey: BUYER_PRIVATE_KEY },
      network: { type: NETWORK_TYPE },
    });
    console.log(`💰 Balance: ${microStxToStx(balance.balance)} STX`);
    if (!balance.sufficient) {
      console.error('❌ Insufficient balance! Get testnet STX from faucet.');
      process.exit(1);
    }
  } catch (error) {
    console.warn('⚠️ Could not check balance, proceeding anyway...');
  }

  console.log('\n--- Discovering Services ---\n');

  // Step 1: Discover available services (free endpoint)
  const servicesRes = await fetch(`${SELLER_URL}/services`);
  if (!servicesRes.ok) {
    console.error('❌ Could not reach seller');
    process.exit(1);
  }
  const services = await servicesRes.json() as { 
    agent: string; 
    services: Array<{ endpoint: string; price: string; description: string }> 
  };
  console.log(`Found agent: ${services.agent}`);
  console.log(`Services available: ${services.services.length}`);
  for (const svc of services.services) {
    console.log(`  - ${svc.endpoint}: ${svc.price} - ${svc.description}`);
  }

  console.log('\n--- Making Paid Requests ---\n');

  // Step 2: Call /summarize (paid)
  console.log('📝 Calling /summarize...');
  const summarizeRes = await x402Fetch(`${SELLER_URL}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'The x402 protocol enables seamless machine-to-machine payments using HTTP 402 status codes. AI agents can now pay each other for services without needing accounts, API keys, or subscriptions. This is a game-changer for the agentic economy.',
    }),
  });

  if (summarizeRes.ok) {
    const summary = await summarizeRes.json() as { summary: string; wordCount: number };
    console.log(`   Result: "${summary.summary}"`);
    console.log(`   Word count: ${summary.wordCount}`);
  } else {
    console.log(`   ❌ Failed: ${summarizeRes.status}`);
  }

  // Step 3: Call /translate (paid)
  console.log('\n🌍 Calling /translate...');
  const translateRes = await x402Fetch(`${SELLER_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Hello World Agent Payment',
      targetLanguage: 'Spanish',
    }),
  });

  if (translateRes.ok) {
    const translation = await translateRes.json() as { translation: string; targetLanguage: string };
    console.log(`   Result: "${translation.translation}"`);
    console.log(`   Language: ${translation.targetLanguage}`);
  } else {
    console.log(`   ❌ Failed: ${translateRes.status}`);
  }

  // Step 4: Call /sentiment (paid)
  console.log('\n😊 Calling /sentiment...');
  const sentimentRes = await x402Fetch(`${SELLER_URL}/sentiment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'I love this amazing new protocol! It is great and excellent!',
    }),
  });

  if (sentimentRes.ok) {
    const sentiment = await sentimentRes.json() as { sentiment: string; score: number };
    console.log(`   Sentiment: ${sentiment.sentiment}`);
    console.log(`   Score: ${sentiment.score.toFixed(2)}`);
  } else {
    console.log(`   ❌ Failed: ${sentimentRes.status}`);
  }

  // Summary
  console.log('\n--- Payment Summary ---\n');
  const totalPaid = paymentsMade.reduce(
    (sum, p) => sum + BigInt(p.amount),
    BigInt(0)
  );
  console.log(`Payments made: ${paymentsMade.length}`);
  console.log(`Total spent: ${microStxToStx(totalPaid.toString())} STX`);
  
  console.log('\nTransactions:');
  for (const payment of paymentsMade) {
    console.log(`  - ${microStxToStx(payment.amount)} STX → ${payment.recipient.slice(0, 15)}...`);
    if (payment.txId) {
      const explorerUrl = NETWORK_TYPE === 'mainnet'
        ? `https://explorer.stacks.co/txid/${payment.txId}`
        : `https://explorer.stacks.co/txid/${payment.txId}?chain=testnet`;
      console.log(`    View: ${explorerUrl}`);
    }
  }

  console.log('\n✅ Demo complete! Agent-to-agent payments successful.\n');
}

main().catch(console.error);
