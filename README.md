# x402 Agent Marketplace

> Agent-to-agent payment protocol using x402 and Stacks blockchain

🏆 **Built for x402 Stacks Challenge** — DoraHacks Hackathon Feb 2026

🌐 **[Live Demo](https://timborn104.github.io/x402-agent-marketplace/)**

## What is this?

A protocol that lets AI agents pay each other for services. No accounts. No API keys. Just HTTP + crypto.

```
Agent A (Buyer):
  "I need BTC price data"
  
Agent B (Oracle):
  POST /oracle/btc-price → 0.001 STX
  
Flow:
  1. Agent A calls /oracle/btc-price
  2. Gets HTTP 402 "Payment Required"  
  3. Auto-signs STX payment
  4. Gets BTC price data ✅
```

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/timborn104/x402-agent-marketplace.git
cd x402-agent-marketplace
npm install
```

### 2. Set up wallets

Create `.env` file in the root:

```env
# Network
NETWORK=testnet

# Seller Agent (Oracle) - receives payments
SELLER_ADDRESS=ST1SQD3VHD3F9PXGMXD5APF441H24SGX4JZHMJJ6R
SELLER_PRIVATE_KEY=734a10993a85a42d1682fb5a6cde406aa2ed7568319ba0a34b79b88cbb103cdc

# Buyer Agent - has ~500 STX on testnet
BUYER_ADDRESS=ST2W4FEZHSEECBGX52SNBWNR9HC596QF34RHQER3R
BUYER_PRIVATE_KEY=48b2a6498ee3e4722ff63f47f5d4e4a73dfaafcab0a570a24f24764ad5689e3a

# Server
PORT=3000
SELLER_URL=http://localhost:3000
```

> 💡 These are pre-funded testnet wallets. For production, generate your own keys!

### 3. Build & Run

```bash
npm run build
node run-demo.mjs
```

That's it! You'll see 3 real STX payments happen on Stacks testnet. 🚀

### Alternative: Run Separately

**Terminal 1** - Start the Oracle Agent:
```bash
node apps/demo-seller/dist/index.js
```

**Terminal 2** - Run the Buyer Agent:
```bash
node apps/demo-buyer/dist/index.js
```

### Web UI

```bash
# Start the Oracle Agent
node apps/demo-seller/dist/index.js

# In another terminal, serve the UI
npx serve apps/demo-ui -p 8080

# Open http://localhost:8080
```

## Paid Endpoints

| Endpoint | Price | Description |
|----------|-------|-------------|
| `POST /oracle/btc-price` | 0.001 STX | Real-time BTC price |
| `POST /oracle/stx-price` | 0.001 STX | Real-time STX price |
| `POST /intel/research` | 0.002 STX | AI-powered research |
| `POST /compute/analyze` | 0.005 STX | GPU data analysis |
| `POST /compute/predict` | 0.003 STX | ML predictions |

## Packages

### @x402/stacks
Core Stacks implementation for x402 protocol.

```typescript
import { 
  createPaymentPayload, 
  verifyPayment, 
  settlePayment 
} from '@x402/stacks';

// Client: Create payment for a requirement
const payload = await createPaymentPayload(requirement, { 
  privateKey: 'your-key' 
});

// Server: Verify the payment
const result = await verifyPayment(payload, requirement);

// Server: Settle on-chain
const settlement = await settlePayment(payload, { type: 'testnet' });
```

### @x402/stacks-express
Express middleware for accepting payments.

```typescript
import { paymentMiddleware } from '@x402/stacks-express';

app.use(paymentMiddleware({
  'POST /oracle/btc-price': { price: '0.001', description: 'BTC price' },
  'POST /intel/research': { price: '0.002', description: 'AI research' },
}, {
  recipientAddress: 'ST1234...',
  network: { type: 'testnet' },
}));
```

### @x402/stacks-fetch
Fetch wrapper for auto-paying requests.

```typescript
import { createX402Fetch } from '@x402/stacks-fetch';

const x402Fetch = createX402Fetch({
  wallet: { privateKey: 'your-key' },
  network: { type: 'testnet' },
});

// Automatically pays if endpoint returns 402
const response = await x402Fetch('https://oracle.example.com/btc-price', {
  method: 'POST',
});
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AGENT MARKETPLACE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐         HTTP 402         ┌──────────────────┐ │
│  │ Buyer Agent  │ ──────────────────────▶  │  Oracle Agent    │ │
│  │ (Client)     │ ◀────────────────────── │  (Server)        │ │
│  │              │   PaymentRequired        │                  │ │
│  └──────────────┘                          └──────────────────┘ │
│         │                                          │            │
│         │ Sign Payment                    Verify & │            │
│         ▼                                 Settle   ▼            │
│  ┌──────────────┐                          ┌──────────────────┐ │
│  │ @x402/stacks │                          │ @x402/stacks     │ │
│  │ -fetch       │                          │ -express         │ │
│  └──────────────┘                          └──────────────────┘ │
│                        │                                         │
│                        ▼                                         │
│              ┌──────────────────┐                               │
│              │  Stacks Network  │                               │
│              │   (Testnet)      │                               │
│              └──────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

## How it Works

1. **Buyer agent** sends HTTP request to Oracle agent
2. **Oracle** responds with `402 Payment Required` + payment details in header
3. **Buyer** signs STX transfer using private key
4. **Buyer** retries request with `X-Payment` header containing signed transaction
5. **Oracle** verifies signature and amount
6. **Oracle** broadcasts transaction to Stacks testnet
7. **Oracle** returns the requested data (BTC price, research, etc.)

## Demo Transactions

View real transactions on Stacks Explorer:
- https://explorer.stacks.co/?chain=testnet

## Tech Stack

- **TypeScript** - Type-safe development
- **npm workspaces** - Monorepo management
- **Stacks.js v7** - Stacks blockchain SDK
- **Express** - HTTP server framework
- **x402** - Open payment protocol

## Resources

- [x402 Protocol](https://x402.org)
- [Stacks Documentation](https://docs.stacks.co)
- [Stacks Testnet Faucet](https://explorer.stacks.co/sandbox/faucet?chain=testnet)
- [Stacks Explorer](https://explorer.stacks.co/?chain=testnet)

## License

Apache-2.0 — Same as x402 protocol

---

Built with 🦞 by JARVIS CLAW for the x402 Stacks Challenge
