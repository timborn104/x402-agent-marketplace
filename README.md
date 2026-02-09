# x402 Agent Marketplace

> Agent-to-agent payment protocol using x402 and Stacks blockchain

🏆 **Built for x402 Stacks Challenge** — DoraHacks Hackathon Feb 2026

## What is this?

A protocol that lets AI agents pay each other for services. No accounts. No API keys. Just HTTP + crypto.

```
Agent A (Translation Bot):
  POST /translate → 0.001 STX per request
  
Agent B (Research Bot):
  - Calls /translate
  - Gets HTTP 402 "Payment Required"  
  - Auto-signs STX payment
  - Gets translation result ✅
```

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up wallets

Create `.env` file in the root:

```env
# Seller wallet (receives payments)
SELLER_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
SELLER_PRIVATE_KEY=your_seller_private_key

# Buyer wallet (makes payments)  
BUYER_PRIVATE_KEY=your_buyer_private_key

# Network
NETWORK=testnet
```

Get testnet STX: https://explorer.stacks.co/sandbox/faucet?chain=testnet

### 3. Build everything

```bash
pnpm build
```

### 4. Run the demo

Terminal 1 - Start the seller:
```bash
cd apps/demo-seller
pnpm start
```

Terminal 2 - Run the buyer:
```bash
cd apps/demo-buyer
pnpm start
```

Watch the buyer discover services and pay for them automatically!

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
  'POST /summarize': { price: '0.001', description: 'Summarize text' },
  'POST /translate': { price: '0.001', description: 'Translate text' },
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
const response = await x402Fetch('https://api.example.com/translate', {
  method: 'POST',
  body: JSON.stringify({ text: 'Hello' }),
});
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AGENT MARKETPLACE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐         HTTP 402         ┌──────────────────┐ │
│  │ Buyer Agent  │ ──────────────────────▶  │  Seller Agent    │ │
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
│              │   (STX + SIP-10) │                               │
│              └──────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

## How it Works

1. **Buyer agent** sends HTTP request to Seller agent
2. **Seller** responds with `402 Payment Required` + payment details in header
3. **Buyer** signs STX payment using private key
4. **Buyer** retries request with `X-Payment` header containing signed payment
5. **Seller** verifies signature and amount
6. **Seller** broadcasts transaction to Stacks network
7. **Seller** returns the requested resource

## API Reference

### Payment Requirement (402 Response Header)

```json
{
  "scheme": "exact",
  "network": "stacks",
  "chainId": 2147483648,
  "recipient": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "amount": "1000",
  "asset": "STX",
  "description": "Summarize text"
}
```

### Payment Payload (Request Header)

```json
{
  "scheme": "exact",
  "network": "stacks",
  "chainId": 2147483648,
  "recipient": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "amount": "1000",
  "asset": "STX",
  "nonce": 42,
  "signature": "...",
  "publicKey": "...",
  "serializedTx": "..."
}
```

## Tech Stack

- **TypeScript** - Type-safe development
- **pnpm** - Fast, disk-efficient package manager
- **Stacks.js** - Stacks blockchain SDK
- **Express** - HTTP server framework
- **x402** - Open payment protocol

## Resources

- [x402 Protocol](https://x402.org)
- [x402 Documentation](https://docs.x402.org)
- [Stacks Documentation](https://docs.stacks.co)
- [Stacks Testnet Faucet](https://explorer.stacks.co/sandbox/faucet?chain=testnet)

## License

Apache-2.0 — Same as x402 protocol

---

Built with 🦞 by JARVIS CLAW for the x402 Stacks Challenge
