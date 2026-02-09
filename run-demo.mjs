import { spawn } from 'child_process';
import { createPaymentPayload, createPaymentRequirement, encodePayment, getWalletAddress, getBalance } from '@x402/stacks';

const SELLER_URL = 'http://localhost:3000';
const BUYER_KEY = '48b2a6498ee3e4722ff63f47f5d4e4a73dfaafcab0a570a24f24764ad5689e3a';

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

async function main() {
  console.log('🚀 Starting Demo Seller...\n');
  
  // Start seller in background
  const seller = spawn('node', ['apps/demo-seller/dist/index.js'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
    env: { ...process.env }
  });
  
  seller.stdout.on('data', (data) => {
    process.stdout.write('[SELLER] ' + data.toString());
  });
  seller.stderr.on('data', (data) => {
    process.stderr.write('[SELLER ERR] ' + data.toString());
  });
  
  // Wait for server to be ready
  const ready = await waitForServer(SELLER_URL);
  if (!ready) {
    console.log('❌ Server failed to start');
    seller.kill();
    process.exit(1);
  }
  
  console.log('\n✅ Server ready!\n');
  console.log('='.repeat(50));
  
  try {
    const buyerAddress = getWalletAddress(BUYER_KEY, 'testnet');
    console.log('🤖 Buyer:', buyerAddress);
    
    const balance = await getBalance(buyerAddress, { type: 'testnet' });
    console.log('💰 Balance:', (Number(balance) / 1000000).toFixed(6), 'STX');
    
    // 1. Request without payment
    console.log('\n📤 Request /summarize WITHOUT payment...');
    const res1 = await fetch(`${SELLER_URL}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hello world' })
    });
    console.log('   Status:', res1.status, res1.status === 402 ? '(Payment Required ✓)' : '');
    
    if (res1.status === 402) {
      const requirement = res1.headers.get('X-Payment-Required');
      const reqData = JSON.parse(Buffer.from(requirement, 'base64').toString());
      console.log('   Amount:', reqData.amount, 'microSTX');
      console.log('   Recipient:', reqData.recipient);
      
      // 2. Create and send payment
      console.log('\n💸 Creating payment...');
      const paymentReq = createPaymentRequirement(
        reqData.recipient,
        reqData.amount,
        { chainId: reqData.chainId }
      );
      
      const payload = await createPaymentPayload(paymentReq, {
        privateKey: BUYER_KEY,
        address: buyerAddress
      });
      console.log('   Nonce:', payload.nonce);
      console.log('   TX:', payload.serializedTx.substring(0, 40) + '...');
      
      // 3. Send with payment
      console.log('\n📤 Request /summarize WITH payment...');
      const encodedPayment = encodePayment(payload);
      
      const res2 = await fetch(`${SELLER_URL}/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Payment': encodedPayment
        },
        body: JSON.stringify({ 
          text: 'The x402 protocol enables HTTP native payments using cryptocurrency.' 
        })
      });
      
      console.log('   Status:', res2.status);
      
      const paymentResponse = res2.headers.get('X-Payment-Response');
      if (paymentResponse) {
        const parsed = JSON.parse(paymentResponse);
        console.log('   TX ID:', parsed.txId);
        console.log('   Settled:', parsed.settled);
      }
      
      if (res2.ok) {
        const data = await res2.json();
        console.log('\n✅ SUCCESS! Response:', JSON.stringify(data, null, 2));
      } else {
        const error = await res2.text();
        console.log('\n❌ Error:', error);
      }
    }
  } catch (err) {
    console.error('\n❌ Error:', err);
  } finally {
    console.log('\n🛑 Stopping server...');
    seller.kill();
    await sleep(500);
  }
}

main();
