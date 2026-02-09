import { spawn } from 'child_process';
import { createPaymentPayload, createPaymentRequirement, encodePayment, getWalletAddress, getBalance } from '@x402/stacks';

const SELLER_URL = 'http://localhost:3000';
const BUYER_KEY = '48b2a6498ee3e4722ff63f47f5d4e4a73dfaafcab0a570a24f24764ad5689e3a';

// Track nonce manually since testnet is slow to update
let currentNonce = null;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer(url, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${url}/health`);
      if (res.ok) return true;
    } catch {
      await sleep(500);
    }
  }
  return false;
}

async function makePayment(endpoint, body = {}) {
  const buyerAddress = getWalletAddress(BUYER_KEY, 'testnet');
  
  // 1. Get payment requirement
  const res1 = await fetch(`${SELLER_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  if (res1.status !== 402) {
    if (res1.ok) return { success: true, data: await res1.json(), paid: false };
    throw new Error(`Unexpected status: ${res1.status}`);
  }
  
  const requirement = res1.headers.get('X-Payment-Required');
  const reqData = JSON.parse(Buffer.from(requirement, 'base64').toString());
  
  // 2. Create payment with manual nonce tracking
  const paymentReq = createPaymentRequirement(
    reqData.recipient,
    reqData.amount,
    { chainId: reqData.chainId }
  );
  
  // Get nonce from network if not set, otherwise increment
  const options = currentNonce !== null ? { nonce: currentNonce } : {};
  
  const payload = await createPaymentPayload(paymentReq, {
    privateKey: BUYER_KEY,
    address: buyerAddress
  }, options);
  
  // Track the nonce we used
  if (currentNonce === null) {
    currentNonce = payload.nonce + 1;
  } else {
    currentNonce++;
  }
  
  // 3. Retry with payment
  const encodedPayment = encodePayment(payload);
  const res2 = await fetch(`${SELLER_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Payment': encodedPayment
    },
    body: JSON.stringify(body)
  });
  
  if (!res2.ok) {
    const err = await res2.text();
    throw new Error(`Payment failed: ${err}`);
  }
  
  return { 
    success: true, 
    data: await res2.json(), 
    paid: true,
    amount: reqData.amount / 1000000 
  };
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║        🔮 x402 Agent Marketplace Demo                    ║');
  console.log('║        AI Agents Paying AI Agents with STX               ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Start seller in background
  const seller = spawn('node', ['apps/demo-seller/dist/index.js'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
    env: { ...process.env }
  });
  
  seller.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(l => l.trim());
    lines.forEach(line => console.log('  [Oracle] ' + line));
  });
  seller.stderr.on('data', (data) => {
    console.log('  [Oracle ERR] ' + data.toString());
  });
  
  const ready = await waitForServer(SELLER_URL);
  if (!ready) {
    console.log('❌ Server failed to start');
    seller.kill();
    process.exit(1);
  }
  
  console.log('\n' + '─'.repeat(60) + '\n');
  
  try {
    const buyerAddress = getWalletAddress(BUYER_KEY, 'testnet');
    const balance = await getBalance(buyerAddress, { type: 'testnet' });
    
    console.log('🤖 BUYER AGENT');
    console.log(`   Address: ${buyerAddress}`);
    console.log(`   Balance: ${(Number(balance) / 1000000).toFixed(6)} STX`);
    
    console.log('\n' + '─'.repeat(60) + '\n');
    
    // Demo 1: BTC Price Oracle
    console.log('📊 Demo 1: Getting BTC Price from Oracle Agent...\n');
    const btc = await makePayment('/oracle/btc-price', {});
    console.log(`   💰 Paid: ${btc.amount} STX`);
    console.log(`   📈 BTC Price: $${btc.data.price.toFixed(2)}`);
    console.log(`   📊 24h Change: ${btc.data.change24h}`);
    console.log(`   🔗 TX: ${btc.data.payment?.txId?.substring(0, 24)}...`);
    
    console.log('\n' + '─'.repeat(60) + '\n');
    
    // Demo 2: AI Research
    console.log('🔍 Demo 2: AI Research on "Stacks Bitcoin DeFi"...\n');
    const research = await makePayment('/intel/research', { 
      query: 'Stacks Bitcoin DeFi ecosystem 2026',
      depth: 'quick'
    });
    console.log(`   💰 Paid: ${research.amount} STX`);
    console.log(`   📝 Summary: ${research.data.summary.substring(0, 80)}...`);
    console.log(`   📊 Confidence: ${(research.data.confidence * 100).toFixed(0)}%`);
    console.log(`   🔗 TX: ${research.data.payment?.txId?.substring(0, 24)}...`);
    
    console.log('\n' + '─'.repeat(60) + '\n');
    
    // Demo 3: ML Prediction
    console.log('🔮 Demo 3: ML Price Prediction...\n');
    const predict = await makePayment('/compute/predict', { 
      series: [100, 105, 103, 108, 112, 110, 115],
      horizon: 3
    });
    console.log(`   💰 Paid: ${predict.amount} STX`);
    console.log(`   📈 Trend: ${predict.data.trend.toUpperCase()}`);
    console.log(`   🎯 Predictions: ${predict.data.predictions.map(p => p.toFixed(1)).join(' → ')}`);
    console.log(`   📊 Confidence: ${(predict.data.confidence * 100).toFixed(0)}%`);
    console.log(`   🔗 TX: ${predict.data.payment?.txId?.substring(0, 24)}...`);
    
    console.log('\n' + '═'.repeat(60) + '\n');
    
    const totalSpent = btc.amount + research.amount + predict.amount;
    
    console.log('✅ DEMO COMPLETE!');
    console.log(`   💸 Total spent: ${totalSpent.toFixed(6)} STX`);
    console.log(`   📝 3 agent-to-agent payments on Stacks testnet!`);
    console.log('\n   View transactions: https://explorer.stacks.co/?chain=testnet\n');
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
  } finally {
    seller.kill();
    await sleep(300);
  }
}

main();
