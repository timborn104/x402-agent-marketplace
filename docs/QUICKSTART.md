# Quick Start

Get the demo running in 5 minutes.

## Prerequisites

- Node.js 20+
- npm 10+
- Stacks testnet wallet with STX

## 1. Clone & Install

```bash
git clone https://github.com/timborn104/x402-agent-marketplace.git
cd x402-agent-marketplace
npm install
npm run build
```

## 2. Get Testnet STX

1. Go to https://explorer.stacks.co/sandbox/faucet?chain=testnet
2. Enter your wallet address
3. Request testnet STX (you'll get 500 STX)

## 3. Configure Wallets

Create `.env` file in the root:

```env
# Network
NETWORK=testnet

# Seller Agent (receives payments)
SELLER_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
SELLER_PRIVATE_KEY=<your-seller-private-key>

# Buyer Agent (makes payments)
BUYER_PRIVATE_KEY=<your-buyer-private-key>

# Server
PORT=3000
SELLER_URL=http://localhost:3000
```

## 4. Generate Wallet Keys (Optional)

If you need new wallets, use the Stacks CLI:

```bash
npx @stacks/cli make_keychain -t
```

This outputs a new testnet wallet with address and private key.

## 5. Run the Demo

### Terminal 1: Start Seller Agent

```bash
cd apps/demo-seller
npm start
```

You should see:
```
🤖 Demo Seller Agent starting...
   Address: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
   Network: testnet

🚀 Demo Seller Agent running on http://localhost:3000
   Available endpoints:
   - GET  /health    (free)
   - GET  /services  (free)
   - POST /summarize (0.001 STX)
   - POST /translate (0.001 STX)
   - POST /sentiment (0.0005 STX)

💡 Waiting for payments...
```

### Terminal 2: Run Buyer Agent

```bash
cd apps/demo-buyer
npm start
```

You should see:
```
🤖 Demo Buyer Agent starting...

Buyer Address: ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC
Seller URL: http://localhost:3000
Network: testnet

💰 Balance: 500.000000 STX

--- Discovering Services ---

Found agent: Demo Seller Agent
Services available: 3
  - POST /summarize: 0.001 STX - Summarize text into a brief overview
  - POST /translate: 0.001 STX - Translate text to another language
  - POST /sentiment: 0.0005 STX - Analyze text sentiment

--- Making Paid Requests ---

📝 Calling /summarize...
💸 Paid 0.001000 STX to ST1PQHQKV...
   TX: 0x123abc...
   Result: "The x402 protocol enables seamless machine-to-machine payments..."

🌍 Calling /translate...
💸 Paid 0.001000 STX to ST1PQHQKV...
   Result: "Hola Mundo Agente Pago"

😊 Calling /sentiment...
💸 Paid 0.000500 STX to ST1PQHQKV...
   Sentiment: positive
   Score: 0.83

--- Payment Summary ---

Payments made: 3
Total spent: 0.002500 STX

✅ Demo complete! Agent-to-agent payments successful.
```

## 6. View Transactions

Check your transactions on the Stacks Explorer:
https://explorer.stacks.co/?chain=testnet

## Next Steps

- [Architecture Guide](./ARCHITECTURE.md) - Understand the payment flow
- [API Reference](./API.md) - Detailed function documentation
- [Integration Guide](./INTEGRATION.md) - Add to your own project

## Troubleshooting

### "Insufficient balance"
- Get more testnet STX from the faucet
- Wait a few minutes for faucet transaction to confirm

### "Connection refused"
- Make sure the seller agent is running on port 3000
- Check SELLER_URL in your .env

### "Invalid private key"
- Private keys should be 64 hex characters (no 0x prefix)
- Generate a new key with `npx @stacks/cli make_keychain -t`
