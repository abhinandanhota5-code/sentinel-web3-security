# SENTINEL — Web3 Security & Protocol Health

> **Multipli Hackathon 2026** // Security & Protocol Health Track  
> **Tagline**: *"From Alert to Evidence."*

Sentinel is an evidence-first Web3 security and protocol health platform. Rather than displaying opaque risk scores (e.g. `85/100`) that cause alarm fatigue, Sentinel decomposes every on-chain threat into verifiable cryptographic evidence, strict confidence classes, and exact dollar blast radius calculations.

---

## 🛡️ Core Tenets

### 1. Confidence Classes (Epistemic Separation)
Every diagnostic finding strictly separates:
- **OBSERVED**: Cryptographically verified on-chain facts (transaction hashes, block heights, storage slot proofs, active allowance amounts).
- **INFERRED**: Technical deductions and derived implications (e.g. spender contract capability to transfer token balance subject to bytecode behavior).
- **UNKNOWN**: Explicit limitations (e.g. on-chain evidence alone cannot prove the counterparty is malicious or reveal off-chain private key controls).

### 2. History vs. Current Exposure
- **HISTORY** (*"What has this entity done?"*): Past swaps, settled transfers, and historical interactions. Settled transactions cannot extract funds today unless unrevoked rights remain.
- **CURRENT EXPOSURE** (*"What can affect this entity RIGHT NOW?"*): Live unrevoked ERC-20 allowances, upgradeable proxies with single-key admins, zero-timelock backdoors, and dangerous delegations.

### 3. Verifiable Blast Radius
- Calculates the exact liquid dollar value currently vulnerable to active permissions.

### 4. Coverage Transparency
- Sentinel strictly adheres to the principle: **Absence of evidence is not evidence of safety**.
- When no findings are detected within analyzed coverage, Sentinel displays:  
  `"No active finding detected within analyzed coverage"` instead of a false binary `"SAFE"` badge.

---

## 🚀 Running the Frontend

### Prerequisites
- Node.js >= 18 (Tested on Node v24.19.0)
- npm >= 9

### Quick Start
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start the development server
npm run dev

# Or build for production
npm run build
```

The app will be live at:
```
http://localhost:5173/
```

Alternatively, from the repository root:
```bash
npm run dev
```

---

## 🔬 Interactive Hackathon Presets

Sentinel includes built-in test scenarios directly accessible from the header and hero presets:
1. **Compromised Wallet (`alex-defi.eth`)**: Demonstrates active `MAX_UINT256` USDC allowance to an unverified spender with a single EOA admin, $3,840.00 liquid blast radius, and simulated revoke calldata.
2. **Multipli Prime Yield Protocol (`0x44D...2e5`)**: Displays the full Protocol Health view including 3/5 Gnosis Safe quorum, 48-hour timelock validation, and Chainlink oracle fallback dependencies.
3. **Privileged Spender Backdoor (`0xDEA...EEF`)**: Highlights critical zero-timelock `emergencyDrain()` selector detection in bytecode.
4. **Cold Multisig Safe (`0x101...010`)**: Demonstrates the non-binary `"No active finding detected within analyzed coverage"` rule for clean entities.

---

## 📁 Architecture & Modularity

- `frontend/src/types/sentinel.ts`: Rich TypeScript models for structured evidence, tripartite reasoning, protocol health diagnostics, and graph networks.
- `frontend/src/services/sentinelApi.ts`: Decoupled data layer that consumes backend evidence structures without polluting UI components with blockchain RPC logic.
- `frontend/src/components/Navbar.tsx`: Global navigation, chain selector, quick address search, and hackathon test presets.
- `frontend/src/components/LandingPage.tsx`: Hero section, value proposition, cybersecurity aesthetic, and rapid investigation launcher.
- `frontend/src/components/Dashboard.tsx`: Unified investigation dashboard with sub-tab navigation and live inspector.
- `frontend/src/components/InvestigationHeader.tsx`: Entity type badge, blast radius ticker, and epistemic summary bar.
- `frontend/src/components/HistoryVsExposure.tsx`: High-contrast side-by-side distinction between historical settled events and active exposure vectors.
- `frontend/src/components/FindingsList.tsx`: Filterable findings cards with tripartite previews and severity indicators.
- `frontend/src/components/EvidenceDetailPanel.tsx`: Expandable inspector drawer displaying raw EVM storage slots, calldata payloads, and remediation simulations.
- `frontend/src/components/EvidenceGraph.tsx`: Interactive relationship graph visually distinguishing Direct Evidence (solid teal lines) from Inferred Risk (dashed amber lines).
- `frontend/src/components/ProtocolHealthView.tsx`: Comprehensive protocol diagnostics (admin concentration, upgradeability, privileged roles, contract dependencies).
- `frontend/src/components/CoverageView.tsx`: Complete coverage scope, active analysis modules, data sources, and explicit limitations.
