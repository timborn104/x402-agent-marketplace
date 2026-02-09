# Architecture

## Overview

The x402 Agent Marketplace enables AI agents to buy and sell services using the x402 payment protocol on Stacks blockchain.

## Payment Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                         PAYMENT FLOW                              │
└──────────────────────────────────────────────────────────────────┘

1. INITIAL REQUEST
   Buyer Agent                              Seller Agent
        │                                        │
        │──── POST /summarize ──────────────────▶│
        │     (no payment header)                │
        │                                        │

2. PAYMENT REQUIRED (402)
        │                                        │
        │◀─── 402 Payment Required ──────────────│
        │     X-Payment-Required: {base64}       │
        │                                        │
        │     Decoded:                           │
        │     {                                  │
        │       scheme: "exact",                 │
        │       network: "stacks",               │
        │       recipient: "ST...",              │
        │       amount: "1000",                  │
        │       asset: "STX"                     │
        │     }                                  │

3. CREATE & SIGN PAYMENT
        │                                        │
        │  ┌─────────────────────┐              │
        │  │ @x402/stacks-fetch  │              │
        │  │ - Parse requirement │              │
        │  │ - Build STX tx      │              │
        │  │ - Sign with key     │              │
        │  └─────────────────────┘              │
        │                                        │

4. RETRY WITH PAYMENT
        │                                        │
        │──── POST /summarize ──────────────────▶│
        │     X-Payment: {signed payload}        │
        │                                        │

5. VERIFY & SETTLE
        │                                        │
        │                    ┌──────────────────┐│
        │                    │ @x402/stacks     ││
        │                    │ - Verify sig     ││
        │                    │ - Check amount   ││
        │                    │ - Broadcast tx   ││
        │                    └──────────────────┘│
        │                            │          │
        │                            ▼          │
        │                    ┌──────────────────┐│
        │                    │ Stacks Blockchain││
        │                    │ (STX transfer)   ││
        │                    └──────────────────┘│
        │                                        │

6. RETURN RESOURCE
        │                                        │
        │◀─── 200 OK ────────────────────────────│
        │     X-Payment-Response: {txId}         │
        │     Body: { summary: "..." }           │
        │                                        │
```

## Package Structure

```
x402-agent-marketplace/
├── packages/
│   ├── stacks/              # Core library
│   │   ├── types.ts         # PaymentPayload, PaymentRequirement
│   │   ├── client.ts        # createPaymentPayload, getWalletAddress
│   │   ├── server.ts        # verifyPayment, settlePayment
│   │   └── utils.ts         # Encoding, STX conversion
│   │
│   ├── stacks-express/      # Server middleware
│   │   └── index.ts         # paymentMiddleware()
│   │
│   └── stacks-fetch/        # Client wrapper
│       └── index.ts         # wrapFetch(), createX402Fetch()
│
├── apps/
│   ├── demo-seller/         # Example paid API server
│   └── demo-buyer/          # Example paying client
│
└── docs/                    # Documentation
```

## Key Types

### PaymentRequirement (Server → Client)

```typescript
interface StacksPaymentRequirement {
  scheme: 'exact';           // Payment type
  network: 'stacks';         // Blockchain network
  chainId: number;           // 1 = mainnet, 2147483648 = testnet
  recipient: string;         // STX address
  amount: string;            // microSTX amount
  asset: 'STX';              // Asset type
  description?: string;      // Human-readable description
}
```

### PaymentPayload (Client → Server)

```typescript
interface StacksPaymentPayload {
  scheme: 'exact';
  network: 'stacks';
  chainId: number;
  recipient: string;
  amount: string;
  asset: 'STX';
  nonce: number;             // Transaction nonce
  signature: string;         // Stacks signature
  publicKey: string;         // Sender's public key
  serializedTx?: string;     // Serialized transaction for settlement
}
```

## Security Considerations

1. **Private Key Protection**: Never expose private keys in code or logs
2. **Amount Limits**: Use `maxAutoPayAmount` in client to prevent excessive payments
3. **Nonce Tracking**: Server should track nonces to prevent replay attacks
4. **HTTPS**: Always use HTTPS in production
5. **Testnet First**: Always test on testnet before mainnet

## Network Configuration

| Network | Chain ID | API URL |
|---------|----------|---------|
| Mainnet | 1 | https://api.mainnet.hiro.so |
| Testnet | 2147483648 | https://api.testnet.hiro.so |
