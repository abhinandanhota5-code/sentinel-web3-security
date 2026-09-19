# Sentinel — Web3 Security & Protocol Health

> **From Alert to Evidence.**

Sentinel is an evidence-first Web3 security and protocol health platform that analyzes wallets, smart contracts, permissions, transaction history, current exposure, and protocol security signals.

---

# 🚀 Quick Start for Judges

## Prerequisites

- Node.js 20+ recommended
- npm
- An Ethereum RPC endpoint
- An Etherscan API key
- A Gemini API key for live AI explanations

---

## 1. Clone the repository

```bash
git clone https://github.com/abhinandanhota5-code/sentinel-web3-security.git
cd sentinel-web3-security

##2. Install dependencies
Install the root dependencies
npm install

Install the frontend dependencies:
cd frontend
npm install
cd ..

Install the backend dependencies:
cd sentinel-api
npm install
cd ..

##3 Configure environment variables
Create .env in the repository root:
touch .env

Add:
ETHERSCAN_API_KEY=your_etherscan_api_key
ETHEREUM_RPC_URL=your_ethereum_rpc_url
GEMINI_API_KEY=your_gemini_api_key
PORT=8787

##4. Start the Sentinel API
Open Terminal 1.

From the repository root:
cd sentinel-api
npm run build
npm start

The API runs on:
http://localhost:8787

Verify the backend:
curl http://localhost:8787/healthz

##5. Start the Sentinel frontend
Open Terminal 2.

From the repository root:
cd frontend
npm run dev
Vite will display the local development URL.

Normally:
http://localhost:5173

##6. Try an investigation

Enter an Ethereum address into the Sentinel investigation interface.
