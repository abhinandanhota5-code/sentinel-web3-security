// Sentinel Data Service Layer
// Decoupled clean interface for consuming structured evidence

import type {
  InvestigationReport,
  NetworkChainId,
  ChainInfo,
  CoverageReport,
  Finding,
  CurrentExposureItem,
  HistoricalActivityItem,
  GraphNode,
  GraphEdge,
  AnalyzeApiResponse,
  RawEngineFinding,
  SeverityLevel,
  EntityType,
  UnknownFieldItem,
} from '../types/sentinel';

export const SUPPORTED_CHAINS: Record<NetworkChainId, ChainInfo> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum Mainnet',
    icon: '⟠',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: 'ETH',
    rpcStatus: 'ACTIVE',
    latestBlock: 20784912,
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum One',
    icon: '🔵',
    blockExplorer: 'https://arbiscan.io',
    nativeCurrency: 'ETH',
    rpcStatus: 'ACTIVE',
    latestBlock: 254129841,
  },
  base: {
    id: 'base',
    name: 'Base',
    icon: '🔷',
    blockExplorer: 'https://basescan.org',
    nativeCurrency: 'ETH',
    rpcStatus: 'ACTIVE',
    latestBlock: 19842104,
  },
  multipli: {
    id: 'multipli',
    name: 'Multipli Testnet',
    icon: '⚡',
    blockExplorer: 'https://explorer.multipli.network',
    nativeCurrency: 'MULTI',
    rpcStatus: 'ACTIVE',
    latestBlock: 1420918,
  },
  optimism: {
    id: 'optimism',
    name: 'Optimism Mainnet',
    icon: '🔴',
    blockExplorer: 'https://optimistic.etherscan.io',
    nativeCurrency: 'ETH',
    rpcStatus: 'ACTIVE',
    latestBlock: 124892102,
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon PoS',
    icon: '💜',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: 'POL',
    rpcStatus: 'ACTIVE',
    latestBlock: 61928400,
  },
};

const COMMON_COVERAGE: CoverageReport = {
  networksChecked: [
    { chain: 'Ethereum Mainnet', status: 'VERIFIED', latestBlockIndexed: 20784912 },
    { chain: 'Base', status: 'VERIFIED', latestBlockIndexed: 19842104 },
    { chain: 'Arbitrum One', status: 'VERIFIED', latestBlockIndexed: 254129841 },
    { chain: 'Multipli Network', status: 'VERIFIED', latestBlockIndexed: 1420918 },
  ],
  analysisModules: [
    {
      id: 'MOD_ALLOWANCE_BLAST',
      name: 'Token Allowance Blast Radius',
      description: 'Checks infinite/excessive ERC-20 allowances against current liquid balance',
      status: 'ACTIVE',
      lastRunLatencyMs: 42,
    },
    {
      id: 'MOD_PROXY_INTEL',
      name: 'Proxy & Implementation Decompiler',
      description: 'Resolves ERC-1967 slots, UUPS, Diamond proxies, and unverified implementation logic',
      status: 'ACTIVE',
      lastRunLatencyMs: 88,
    },
    {
      id: 'MOD_ADMIN_CONCENTRATION',
      name: 'Governance & Timelock Auditor',
      description: 'Detects single-signer key concentration, 0-second timelocks, and direct owner roles',
      status: 'ACTIVE',
      lastRunLatencyMs: 65,
    },
    {
      id: 'MOD_DEPENDENCY_GRAPH',
      name: 'Oracle & External Dependency Tracer',
      description: 'Maps Spot AMM oracles, price feed freshness, and cross-contract call hops',
      status: 'ACTIVE',
      lastRunLatencyMs: 110,
    },
  ],
  dataSources: [
    { name: 'Multipli RPC Archive Node', provider: 'Multipli Infrastructure', type: 'RPC_ARCHIVE', freshness: '1 block (~2s)' },
    { name: 'Forta Threat Intelligence', provider: 'Forta Bot Network', type: 'BOT_TELEMETRY', freshness: 'Real-time feed' },
    { name: 'Hypernative Heuristic Models', provider: 'Hypernative Security API', type: 'BYTECODE_ANALYZER', freshness: 'Active block' },
    { name: 'EVM State Diff Indexer', provider: 'Sentinel Internal Ingestor', type: 'INDEXER', freshness: '100% synchronized' },
  ],
  limitations: [
    'Bytecode-only contracts without verified source code rely on heuristic opcodes and decompiler inference.',
    'Off-chain governance actions (e.g. Snapshot proposals, Discord admin discussions) are not observable on-chain.',
    'Private mempool (MEV/Flashbots) bundle executions cannot be monitored prior to block inclusion.',
    'Allowance checks reflect current block state; sudden pending transactions in mempool may alter balances before confirmation.',
  ],
  disclaimer:
    'Sentinel does not provide absolute guarantees of safety. The absence of findings indicates that no known risk indicators were observed within the analyzed coverage scope.',
};

// ==========================================
// PRESET 1: Compromised EOA Wallet with Active Unlimited Approval
// ==========================================
export const PRESET_COMPROMISED_WALLET: InvestigationReport = {
  targetAddress: '0x71C8fb8172F19E9EFEa17c76B93F783309a632B4',
  chain: SUPPORTED_CHAINS.ethereum,
  entityType: 'WALLET_EOA',
  ensName: 'alex-defi.eth',
  dataMode: 'PRESET',
  investigatedAt: '2026-09-19T11:45:00Z',
  totalBlastRadiusUsd: 3840.0,
  summary: {
    observedFactsCount: 4,
    inferredHypothesesCount: 2,
    unknownBoundariesCount: 1,
    activeExposuresCount: 2,
    criticalFindingsCount: 1,
  },
  currentExposures: [
    {
      id: 'EXP-01',
      title: 'Active Unlimited Token Approval (USDC)',
      type: 'UNLIMITED_TOKEN_APPROVAL',
      severity: 'HIGH',
      description:
        'Wallet has granted maximum uint256 allowance to Router X (0x123...DEF). The spender can transfer all current and future USDC without further user authorization.',
      vulnerableAsset: {
        symbol: 'USDC',
        amount: '3,840.00',
        usdValue: 3840.0,
      },
      governingEntity: {
        address: '0x71C8fb8172F19E9EFEa17c76B93F783309a632B4',
        label: 'alex-defi.eth (Target Wallet)',
        entityType: 'WALLET_EOA',
      },
      counterparty: {
        address: '0x123f681646d4a755815f9ab19e1ad077d33bf401',
        label: 'Unverified DEX Spender Router',
        entityType: 'PROXY_CONTRACT',
      },
      activeSince: '3 days ago (Block 20779140)',
      revocable: true,
      blastRadiusUsd: 3840.0,
      directEvidenceProof: 'Storage slot 0x2c for USDC token contract stores 0xffffffffffffffffffffffffffffffff',
    },
    {
      id: 'EXP-02',
      title: 'Upgradeable Spender Logic Controlled by Single EOA Admin',
      type: 'UPGRADEABLE_LOGIC',
      severity: 'MEDIUM',
      description:
        'The contract holding your USDC allowance is an ERC-1967 Transparent Proxy. The admin key (0xABC...442) has 0-second timelock and can redirect all function calls to a malicious implementation at any time.',
      governingEntity: {
        address: '0xABCd928374829102938472918237492817293442',
        label: 'Spender Proxy Admin',
        entityType: 'WALLET_EOA',
      },
      counterparty: {
        address: '0x123f681646d4a755815f9ab19e1ad077d33bf401',
        label: 'Unverified DEX Spender Router',
        entityType: 'PROXY_CONTRACT',
      },
      activeSince: 'Block 20775000',
      revocable: false,
      blastRadiusUsd: 3840.0,
      directEvidenceProof: 'EIP-1967 admin slot 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103 returns 0xABC...442',
    },
  ],
  historicalActivities: [
    {
      id: 'HIST-01',
      timestamp: '2026-09-16T08:24:12Z',
      transactionHash: '0x9a8f12c478a2e1d743bf0892c9081e7d2345bc890123ef4567890abcdef12345',
      blockNumber: 20779140,
      actionType: 'APPROVAL',
      description: 'Submitted approval transaction with Max Uint256 allowance to 0x123...DEF',
      counterparty: {
        address: '0x123f681646d4a755815f9ab19e1ad077d33bf401',
        label: 'Unverified DEX Spender Router',
        entityType: 'PROXY_CONTRACT',
      },
      valueUsd: 0,
      status: 'SETTLED',
      threatSignificance: 'PRIOR_ANOMALY',
      note: 'The approval transaction itself was executed successfully in the past. Its ongoing danger exists solely because the allowance has NOT yet been revoked.',
    },
    {
      id: 'HIST-02',
      timestamp: '2026-09-14T14:10:05Z',
      transactionHash: '0x5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
      blockNumber: 20768910,
      actionType: 'SWAP',
      description: 'Uniswap V3 swap 1.5 ETH for 3,840 USDC',
      counterparty: {
        address: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
        label: 'Uniswap V3 SwapRouter',
        entityType: 'SMART_CONTRACT',
      },
      valueUsd: 3840.0,
      status: 'SETTLED',
      threatSignificance: 'BENIGN',
      note: 'Normal DeFi trade. Settled on-chain without lingering unrevoked router permissions.',
    },
    {
      id: 'HIST-03',
      timestamp: '2026-08-10T19:44:00Z',
      transactionHash: '0x11223344556677889900aabbccddeeff0011223344556677889900aabbccdde',
      blockNumber: 20610234,
      actionType: 'TRANSFER',
      description: 'Transfer 0.5 ETH from Binance hot wallet',
      counterparty: {
        address: '0x28C6c06298d514Db089934071355E5743bf21d60',
        label: 'Binance Hot Wallet 14',
        entityType: 'WALLET_EOA',
      },
      valueUsd: 1250.0,
      status: 'SETTLED',
      threatSignificance: 'BENIGN',
      note: 'Inflow from centralized exchange. Concluded transaction with zero continuing exposure.',
    },
  ],
  findings: [
    {
      id: 'FND-001',
      findingType: 'UNLIMITED_ALLOWANCE',
      severity: 'HIGH',
      confidence: 'OBSERVED',
      title: 'Active Unlimited Token Approval to Spender Contract',
      summary:
        'Wallet has granted an infinite allowance (type: MAX_UINT256) of USDC to an external contract. The spender can withdraw the entire balance at any time without further interaction.',
      category: 'EXPOSURE',
      tripartite: {
        observed: [
          'Wallet 0x71C...B44 signed transaction 0x9a8f...2345 on Ethereum block 20,779,140 calling approve(0x123...DEF, MAX_UINT256).',
          'Token contract 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 (USDC) storage state at slot mapping(0x71C..., 0x123...) remains set to 115792089237316195423570985008687907853269984665640564039457584007913129639935.',
          'Wallet currently holds 3,840.00 liquid USDC ($3,840.00 USD).',
        ],
        inferred: [
          'Contract 0x123...DEF has the on-chain technical capability to call transferFrom() and drain up to $3,840.00 USDC directly from the wallet.',
          'If the contract logic contains vulnerabilities or if the owner of 0x123...DEF is malicious, funds can be extracted without user notification.',
        ],
        unknown: [
          'On-chain evidence alone does not establish whether Contract 0x123...DEF is currently malicious or operated by a compromised actor.',
          'It is unknown whether the contract owner intends to trigger transferFrom() or if it is purely an inactive automated routing approval.',
        ],
      },
      token: {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        usdPrice: 1.0,
      },
      spender: {
        address: '0x123f681646d4a755815f9ab19e1ad077d33bf401',
        label: 'Spender Contract X',
        entityType: 'PROXY_CONTRACT',
      },
      allowance: '115792089237316195423570985008687907853269984665640564039457584007913129639935',
      dollarAtRisk: 3840.0,
      evidence: {
        transactionHash: '0x9a8f12c478a2e1d743bf0892c9081e7d2345bc890123ef4567890abcdef12345',
        blockNumber: 20779140,
        timestamp: '2026-09-16T08:24:12Z',
        contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        formattedAllowance: 'MAX_UINT256 (Unlimited)',
        rawCalldata: '0x095ea7b3000000000000000000000000123f681646d4a755815f9ab19e1ad077d33bf401ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        stateSlot: '0x2c98d01...881f',
        verificationMethod: 'RPC_STATE_CALL',
      },
      remediation: {
        actionText: 'Revoke USDC approval for Spender Contract (Set allowance to 0)',
        actionType: 'REVOKE_APPROVAL',
        contractToCall: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        suggestedCalldata: '0x095ea7b3000000000000000000000000123f681646d4a755815f9ab19e1ad077d33bf4010000000000000000000000000000000000000000000000000000000000000000',
      },
    },
    {
      id: 'FND-002',
      findingType: 'UPGRADEABLE_PROXY_RISK',
      severity: 'MEDIUM',
      confidence: 'OBSERVED',
      title: 'Spender Contract Uses Proxy Architecture with Single EOA Admin',
      summary:
        'The contract holding authorization to spend user assets can be upgraded instantly by a private EOA key without a governance timelock.',
      category: 'GOVERNANCE',
      tripartite: {
        observed: [
          'Address 0x123...DEF implements EIP-1967 transparent upgradeable proxy standard.',
          'Admin storage slot points to single externally owned account 0xABC...442.',
          'Current implementation contract was deployed 14 days ago at 0x987...112.',
        ],
        inferred: [
          'Private key holder of 0xABC...442 can execute upgradeToAndCall() at any block, inserting arbitrary logic such as a sweep() function that drains authorized wallets.',
        ],
        unknown: [
          'Identity and physical security practices of the private key controlling 0xABC...442 cannot be verified from chain data alone.',
        ],
      },
      spender: {
        address: '0x123f681646d4a755815f9ab19e1ad077d33bf401',
        label: 'Spender Contract X',
        entityType: 'PROXY_CONTRACT',
      },
      evidence: {
        contractAddress: '0x123f681646d4a755815f9ab19e1ad077d33bf401',
        stateSlot: '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103',
        verificationMethod: 'BYTECODE_DECOMPILATION',
      },
    },
  ],
  evidenceGraph: {
    nodes: [
      { id: 'wallet', label: 'alex-defi.eth', sublabel: '0x71C...B44', type: 'WALLET', isTarget: true, badge: 'Investigated Target' },
      { id: 'token_usdc', label: 'USDC Token', sublabel: '$3,840 Bal', type: 'TOKEN', badge: 'Active Asset' },
      { id: 'spender', label: 'Spender Contract X', sublabel: '0x123...DEF', type: 'SPENDER', badge: 'Active Approval' },
      { id: 'admin', label: 'Single Admin Key', sublabel: '0xABC...442', type: 'ADMIN', badge: '0s Timelock' },
      { id: 'implementation', label: 'Implementation V1', sublabel: '0x987...112', type: 'IMPLEMENTATION', badge: 'Upgradeable Logic' },
    ],
    edges: [
      {
        id: 'e1',
        source: 'wallet',
        target: 'token_usdc',
        relationship: 'holds balance of',
        relationshipType: 'DIRECT_EVIDENCE',
        evidenceRef: 'State proof at USDC balance mapping: 3,840.00 USDC ($3,840 USD)',
      },
      {
        id: 'e2',
        source: 'wallet',
        target: 'spender',
        relationship: 'approved allowance',
        relationshipType: 'DIRECT_EVIDENCE',
        evidenceRef: 'Tx 0x9a8f...2345 (Block 20779140): MAX_UINT256',
        transactionHash: '0x9a8f12c478a2e1d743bf0892c9081e7d2345bc890123ef4567890abcdef12345',
      },
      {
        id: 'e3',
        source: 'spender',
        target: 'admin',
        relationship: 'controlled by',
        relationshipType: 'DIRECT_EVIDENCE',
        evidenceRef: 'EIP-1967 Admin Storage Slot = 0xABCd928374829102938472918237492817293442',
      },
      {
        id: 'e4',
        source: 'spender',
        target: 'implementation',
        relationship: 'routes calls to',
        relationshipType: 'DIRECT_EVIDENCE',
        evidenceRef: 'EIP-1967 Implementation Slot = 0x9871f3014a51e6b8c4d2e9f01837491827498112',
      },
      {
        id: 'e5',
        source: 'admin',
        target: 'implementation',
        relationship: 'can replace logic arbitrarily',
        relationshipType: 'INFERRED',
        evidenceRef: 'Inferred from lack of timelock contract between Admin EOA and Proxy upgradeTo() selector',
      },
      {
        id: 'e6',
        source: 'spender',
        target: 'token_usdc',
        relationship: 'may extract wallet balance',
        relationshipType: 'INFERRED',
        evidenceRef: 'Derived: Allowance is active + wallet has liquid balance + spender has transferFrom logic',
      },
    ],
  },
  coverage: COMMON_COVERAGE,
};

// ==========================================
// PRESET 2: Multipli Yield Vault Protocol Health View
// ==========================================
export const PRESET_MULTIPLI_PROTOCOL: InvestigationReport = {
  targetAddress: '0x44D9a51837F81b1E13d508F850B3e1c0154942e5',
  chain: SUPPORTED_CHAINS.multipli,
  entityType: 'VAULT_ERC4626',
  contractName: 'Multipli Prime Yield Engine V2',
  dataMode: 'PRESET',
  investigatedAt: '2026-09-19T11:48:00Z',
  totalBlastRadiusUsd: 4250000.0,
  summary: {
    observedFactsCount: 12,
    inferredHypothesesCount: 3,
    unknownBoundariesCount: 2,
    activeExposuresCount: 1,
    criticalFindingsCount: 0,
  },
  currentExposures: [
    {
      id: 'EXP-PROTO-01',
      title: 'Timelock Delayed Upgradeability Window',
      type: 'UPGRADEABLE_LOGIC',
      severity: 'LOW',
      description:
        'Protocol vault uses UUPS upgrade pattern guarded by a 48-hour Timelock Controller and a 3-of-5 Gnosis Safe. Upgrades require scheduled on-chain delay.',
      vulnerableAsset: {
        symbol: 'mUSD',
        amount: '4,250,000.00',
        usdValue: 4250000.0,
      },
      governingEntity: {
        address: '0x99A8c213456789abcdef0123456789abcdef0123',
        label: 'Multipli Governance Timelock',
        entityType: 'SMART_CONTRACT',
      },
      counterparty: {
        address: '0x44D9a51837F81b1E13d508F850B3e1c0154942e5',
        label: 'Multipli Prime Yield Engine V2',
        entityType: 'VAULT_ERC4626',
      },
      activeSince: '60 days ago',
      revocable: false,
      blastRadiusUsd: 4250000.0,
      directEvidenceProof: 'TimelockController delay parameter = 172,800 seconds (48 hours)',
    },
  ],
  historicalActivities: [
    {
      id: 'HIST-P1',
      timestamp: '2026-09-18T16:20:00Z',
      transactionHash: '0x334455aabbccddeeff0011223344556677889900aabbccddeeff001122334455',
      blockNumber: 1419820,
      actionType: 'DEPOSIT',
      description: 'Institutional LP deposited 250,000 mUSD into Multipli Prime Vault',
      counterparty: {
        address: '0x8877665544332211009988776655443322110099',
        label: 'Apex Capital Vault',
        entityType: 'WALLET_EOA',
      },
      valueUsd: 250000.0,
      status: 'SETTLED',
      threatSignificance: 'BENIGN',
      note: 'Normal liquidity provision event.',
    },
  ],
  findings: [
    {
      id: 'FND-P01',
      findingType: 'ORACLE_MANIPULATION_DEPENDENCY',
      severity: 'MEDIUM',
      confidence: 'OBSERVED',
      title: 'Secondary Spot AMM Fallback in Oracle Resolver',
      summary:
        'Vault uses Chainlink primary oracle but falls back to Uniswap V3 TWAP (10-minute window) during sequencer downtime, introducing slight arbitrage risk during high volatility.',
      category: 'ORACLE',
      tripartite: {
        observed: [
          'Decompiled logic reveals checkSequencerUptime() returns fallback Oracle 0x77F...112.',
          'Fallback oracle queries Uniswap V3 Pool with 600-second observations cardinality.',
        ],
        inferred: [
          'If Chainlink feed pauses during extreme congestion, flashloan arbitrageurs could bias the 10m TWAP curve with heavy liquidity tilts.',
        ],
        unknown: [
          'Multipli sequencer historical downtime is under 0.01%; whether the fallback condition will ever trigger is probabilistic.',
        ],
      },
      evidence: {
        contractAddress: '0x44D9a51837F81b1E13d508F850B3e1c0154942e5',
        verificationMethod: 'BYTECODE_DECOMPILATION',
      },
    },
  ],
  evidenceGraph: {
    nodes: [
      { id: 'vault', label: 'Multipli Vault V2', sublabel: '0x44D...2e5', type: 'IMPLEMENTATION', isTarget: true, badge: 'Target Protocol' },
      { id: 'timelock', label: '48h Timelock', sublabel: '0x99A...123', type: 'ADMIN', badge: 'Guarded Delay' },
      { id: 'multisig', label: '3-of-5 Safe', sublabel: '0x55C...991', type: 'ADMIN', badge: 'Decentralized Key' },
      { id: 'oracle_chainlink', label: 'Chainlink Feed', sublabel: 'mUSD/USD', type: 'ORACLE', badge: 'Primary Oracle' },
      { id: 'oracle_twap', label: 'UniV3 TWAP (10m)', sublabel: 'Fallback Pool', type: 'ORACLE', badge: 'Secondary Fallback' },
    ],
    edges: [
      {
        id: 'ep1',
        source: 'vault',
        target: 'timelock',
        relationship: 'governed by timelock',
        relationshipType: 'DIRECT_EVIDENCE',
        evidenceRef: 'Vault owner address = 0x99A...123',
      },
      {
        id: 'ep2',
        source: 'timelock',
        target: 'multisig',
        relationship: 'proposer/executor role',
        relationshipType: 'DIRECT_EVIDENCE',
        evidenceRef: 'PROPOSER_ROLE assigned to Gnosis Safe 0x55C...991',
      },
      {
        id: 'ep3',
        source: 'vault',
        target: 'oracle_chainlink',
        relationship: 'fetches NAV price',
        relationshipType: 'DIRECT_EVIDENCE',
        evidenceRef: 'Calls latestRoundData() on primary aggregator 0x221...889',
      },
      {
        id: 'ep4',
        source: 'vault',
        target: 'oracle_twap',
        relationship: 'fallback if sequencer down',
        relationshipType: 'INFERRED',
        evidenceRef: 'Inferred branch condition triggered only when sequencer uptime status flag == 0',
      },
    ],
  },
  protocolHealth: {
    protocolName: 'Multipli Prime Yield Engine',
    protocolSlug: 'multipli-prime',
    isDemoData: true,
    totalValueLockedUsd: 4250000.0,
    totalExposedValueUsd: 180000.0,
    overallHealthGrade: 'A',
    adminConcentration: {
      multisigRequiredSigners: 3,
      multisigTotalSigners: 5,
      thresholdPercentage: 60,
      timelockDelayHours: 48,
      guardianCanVeto: true,
      status: 'OPTIMAL',
      details: 'Decentralized 3-of-5 multisig with 48h timelock enforcement. No single keyholder can execute arbitrary commands.',
    },
    upgradeability: {
      proxyType: 'UUPS',
      implementationAddress: '0x8891047120938572109485721094857210948123',
      upgradeAdmin: {
        address: '0x99A8c213456789abcdef0123456789abcdef0123',
        label: 'Multipli Governance Timelock',
        entityType: 'SMART_CONTRACT',
      },
      upgradeDelayHours: 48,
      timelockActive: true,
      verificationStatus: 'VERIFIED',
      status: 'OPTIMAL',
    },
    privilegedPermissions: [
      {
        role: 'PAUSER_ROLE',
        holder: {
          address: '0x1111222233334444555566667777888899990000',
          label: 'Automated Guardian Bot',
          entityType: 'SMART_CONTRACT',
        },
        capabilities: ['pause() deposits and withdrawals during detected anomaly'],
        canDrainFunds: false,
        timelocked: false,
      },
      {
        role: 'DEFAULT_ADMIN_ROLE',
        holder: {
          address: '0x99A8c213456789abcdef0123456789abcdef0123',
          label: '48h Timelock Controller',
          entityType: 'SMART_CONTRACT',
        },
        capabilities: ['grantRole', 'revokeRole', 'upgradeToAndCall'],
        canDrainFunds: false,
        timelocked: true,
      },
    ],
    contractDependencies: [
      {
        name: 'Chainlink mUSD/USD Feed',
        category: 'ORACLE',
        address: '0x2211443355221144335522114433552211443355',
        criticality: 'CRITICAL',
        healthStatus: 'HEALTHY',
        failureImpact: 'Halts rebalance if heartbeat > 3600s',
      },
      {
        name: 'Multipli Native AMM Router',
        category: 'DEX_ROUTER',
        address: '0x6677889900aabbccddeeff001122334455667788',
        criticality: 'HIGH',
        healthStatus: 'HEALTHY',
        failureImpact: 'Limits yield compounding slippage',
      },
    ],
    activityAnomalies: [
      {
        type: 'Slippage Spike (Absorbed)',
        detectedAt: '2 days ago',
        description: 'Temporary 0.4% divergence on underlying curve during market rebalance. Within invariant limits.',
        deviationScore: '0.12 (Normal)',
        source: 'MULTIPLI_ANALYZER',
      },
    ],
  },
  coverage: COMMON_COVERAGE,
};

// ==========================================
// PRESET 3: Clean Hardware Safe (No Active Findings Rule Check)
// ==========================================
export const PRESET_CLEAN_SAFE: InvestigationReport = {
  targetAddress: '0x1010101010101010101010101010101010101010',
  chain: SUPPORTED_CHAINS.ethereum,
  entityType: 'MULTISIG_SAFE',
  ensName: 'treasury-cold.eth',
  dataMode: 'PRESET',
  investigatedAt: '2026-09-19T11:50:00Z',
  totalBlastRadiusUsd: 0.0,
  summary: {
    observedFactsCount: 6,
    inferredHypothesesCount: 0,
    unknownBoundariesCount: 1,
    activeExposuresCount: 0,
    criticalFindingsCount: 0,
  },
  currentExposures: [],
  historicalActivities: [
    {
      id: 'HIST-C1',
      timestamp: '2026-09-01T12:00:00Z',
      transactionHash: '0x99887766554433221100ffeeddccbbaa99887766554433221100ffeeddccbbaa',
      blockNumber: 20700000,
      actionType: 'DEPOSIT',
      description: 'Treasury cold storage funding from Coinbase Prime',
      counterparty: {
        address: '0x503828976D22510aad0201ac7EC88293211A23Da',
        label: 'Coinbase Prime Custody',
        entityType: 'WALLET_EOA',
      },
      valueUsd: 1500000.0,
      status: 'SETTLED',
      threatSignificance: 'BENIGN',
      note: 'Funds reside in native multi-sig with zero third-party token approvals.',
    },
  ],
  findings: [
    {
      id: 'FND-SAFE-01',
      findingType: 'NO_ACTIVE_FINDINGS',
      severity: 'INFORMATIONAL',
      confidence: 'OBSERVED',
      title: 'No active finding detected within analyzed coverage',
      summary:
        'All tested exposure modules (unlimited approvals, dangerous delegation, unverified proxies, 0s timelocks) returned zero active threats against this entity.',
      category: 'EXPOSURE',
      tripartite: {
        observed: [
          'Address is a verified Gnosis Safe V1.4.1 contract with 4-of-7 multisig threshold.',
          'Zero ERC-20 allowances greater than 0 are currently registered in analyzed token contracts.',
          'No delegatecall or permit2 signatures were active in storage at block 20,784,912.',
        ],
        inferred: [
          'Under current state, no external party has pre-authorized permission to move funds from this safe without 4 threshold signatures.',
        ],
        unknown: [
          'Whether the 7 physical signers keep their hardware wallets in secure locations cannot be verified on-chain.',
        ],
      },
      evidence: {
        contractAddress: '0x1010101010101010101010101010101010101010',
        verificationMethod: 'RPC_STATE_CALL',
      },
    },
  ],
  evidenceGraph: {
    nodes: [
      { id: 'safe', label: 'treasury-cold.eth', sublabel: 'Gnosis Safe 4/7', type: 'WALLET', isTarget: true, badge: 'Target Safe' },
      { id: 'owner1', label: 'Hardware Key 1', sublabel: '0x111...001', type: 'ADMIN', badge: 'Signer' },
      { id: 'owner2', label: 'Hardware Key 2', sublabel: '0x222...002', type: 'ADMIN', badge: 'Signer' },
      { id: 'owner3', label: 'Hardware Key 3', sublabel: '0x333...003', type: 'ADMIN', badge: 'Signer' },
    ],
    edges: [
      {
        id: 'ec1',
        source: 'safe',
        target: 'owner1',
        relationship: 'requires signature from',
        relationshipType: 'DIRECT_EVIDENCE',
        evidenceRef: 'getOwners() returns 0x111...001',
      },
      {
        id: 'ec2',
        source: 'safe',
        target: 'owner2',
        relationship: 'requires signature from',
        relationshipType: 'DIRECT_EVIDENCE',
        evidenceRef: 'getOwners() returns 0x222...002',
      },
      {
        id: 'ec3',
        source: 'safe',
        target: 'owner3',
        relationship: 'requires signature from',
        relationshipType: 'DIRECT_EVIDENCE',
        evidenceRef: 'getOwners() returns 0x333...003',
      },
    ],
  },
  coverage: COMMON_COVERAGE,
};

// ==========================================
// PRESET 4: High-Risk Upgradeable Spender / Privileged Admin Backdoor
// ==========================================
export const PRESET_ADMIN_CONCENTRATION: InvestigationReport = {
  targetAddress: '0xDEADbeef0000000000000000000000000000BEEF',
  chain: SUPPORTED_CHAINS.base,
  entityType: 'PROXY_CONTRACT',
  contractName: 'ShadySwap Yield Router V1',
  dataMode: 'PRESET',
  investigatedAt: '2026-09-19T11:52:00Z',
  totalBlastRadiusUsd: 840000.0,
  summary: {
    observedFactsCount: 8,
    inferredHypothesesCount: 4,
    unknownBoundariesCount: 2,
    activeExposuresCount: 3,
    criticalFindingsCount: 2,
  },
  currentExposures: [
    {
      id: 'EXP-ADM-01',
      title: 'Zero-Timelock Privileged Withdraw Selector Detected',
      type: 'PRIVILEGED_ADMIN',
      severity: 'CRITICAL',
      description:
        'Contract bytecode contains an unrestricted emergencyDrain(address,uint256) function callable solely by the contract owner (0x555...123) without timelock or multisig.',
      vulnerableAsset: {
        symbol: 'WETH',
        amount: '240.00',
        usdValue: 840000.0,
      },
      governingEntity: {
        address: '0x555544443333222211110000aaaabbbbcccc1234',
        label: 'Deployer Private Key EOA',
        entityType: 'WALLET_EOA',
      },
      counterparty: {
        address: '0xDEADbeef0000000000000000000000000000BEEF',
        label: 'ShadySwap Yield Router',
        entityType: 'PROXY_CONTRACT',
      },
      activeSince: 'Block 19820000',
      revocable: false,
      blastRadiusUsd: 840000.0,
      directEvidenceProof: 'Selector 0x853828b1 matches signature emergencyDrain(address,uint256) with onlyOwner modifier check',
    },
    {
      id: 'EXP-ADM-02',
      title: 'Unverified Proxy Implementation Bytecode',
      type: 'UPGRADEABLE_LOGIC',
      severity: 'HIGH',
      description:
        'The target contract delegates execution to an implementation whose source code has not been published or verified on Basescan.',
      governingEntity: {
        address: '0x555544443333222211110000aaaabbbbcccc1234',
        label: 'Deployer Private Key EOA',
        entityType: 'WALLET_EOA',
      },
      counterparty: {
        address: '0x77776666555544443333222211110000ffff9999',
        label: 'Unverified Implementation',
        entityType: 'SMART_CONTRACT',
      },
      activeSince: 'Block 19825000',
      revocable: false,
      blastRadiusUsd: 840000.0,
      directEvidenceProof: 'Etherscan API: Contract source code not verified',
    },
  ],
  historicalActivities: [
    {
      id: 'HIST-A1',
      timestamp: '2026-09-17T03:12:00Z',
      transactionHash: '0x8899aabbccddeeff0011223344556677889900aabbccddeeff00112233445566',
      blockNumber: 19820000,
      actionType: 'CONTRACT_DEPLOY',
      description: 'Contract deployed by 0x555...123 using unshielded RPC',
      counterparty: {
        address: '0x555544443333222211110000aaaabbbbcccc1234',
        label: 'Deployer Private Key EOA',
        entityType: 'WALLET_EOA',
      },
      valueUsd: 0,
      status: 'SETTLED',
      threatSignificance: 'BENIGN',
      note: 'Deployment transaction succeeded. The risk stems from the unconstrained code in state.',
    },
  ],
  findings: [
    {
      id: 'FND-ADM-001',
      findingType: 'ZERO_TIMELOCK_PRIVILEGE',
      severity: 'CRITICAL',
      confidence: 'OBSERVED',
      title: 'Backdoor emergencyDrain function callable by Single Key',
      summary:
        'Decompiled bytecode confirms single key owner has immediate rights to transfer contract pooled balances to an arbitrary recipient.',
      category: 'GOVERNANCE',
      tripartite: {
        observed: [
          'Function selector 0x853828b1 executes SLOAD of slot 0 (owner address 0x555...123).',
          'If msg.sender == owner, calls raw CALL with value or transferFrom on token parameter.',
          'No delay timer, queue step, or event emission guard exists.',
        ],
        inferred: [
          'The deployer can pull a rugpull or drain event in a single atomic transaction whenever pooled liquidity peaks.',
        ],
        unknown: [
          'Whether the deployer is an anonymous bad actor or an inexperienced developer who copied template code.',
        ],
      },
      dollarAtRisk: 840000.0,
      evidence: {
        contractAddress: '0xDEADbeef0000000000000000000000000000BEEF',
        rawCalldata: '0x853828b1',
        verificationMethod: 'BYTECODE_DECOMPILATION',
      },
    },
  ],
  evidenceGraph: {
    nodes: [
      { id: 'contract', label: 'ShadySwap Router', sublabel: '0xDEA...EEF', type: 'SPENDER', isTarget: true, badge: 'Target Contract' },
      { id: 'admin', label: 'Single Key Admin', sublabel: '0x555...123', type: 'ADMIN', badge: 'Critical Privileges' },
      { id: 'impl', label: 'Unverified Impl', sublabel: '0x777...999', type: 'IMPLEMENTATION', badge: 'Unverified' },
      { id: 'vault', label: 'WETH Liquidity', sublabel: '$840,000 Bal', type: 'TOKEN', badge: 'Vulnerable Funds' },
    ],
    edges: [
      {
        id: 'ea1',
        source: 'contract',
        target: 'admin',
        relationship: 'owned by single key',
        relationshipType: 'DIRECT_EVIDENCE',
        evidenceRef: 'Owner slot 0 = 0x555...123',
      },
      {
        id: 'ea2',
        source: 'contract',
        target: 'impl',
        relationship: 'delegates execution to',
        relationshipType: 'DIRECT_EVIDENCE',
        evidenceRef: 'Delegatecall opcode destination in fallback()',
      },
      {
        id: 'ea3',
        source: 'admin',
        target: 'vault',
        relationship: 'can execute instant drain',
        relationshipType: 'INFERRED',
        evidenceRef: 'Hypothesis: Selector 0x853828b1 allows direct owner withdrawal without timelock',
      },
    ],
  },
  coverage: COMMON_COVERAGE,
};

// Preset lookup table
export const INVESTIGATION_PRESETS: Record<string, InvestigationReport> = {
  [PRESET_COMPROMISED_WALLET.targetAddress.toLowerCase()]: PRESET_COMPROMISED_WALLET,
  [PRESET_MULTIPLI_PROTOCOL.targetAddress.toLowerCase()]: PRESET_MULTIPLI_PROTOCOL,
  [PRESET_CLEAN_SAFE.targetAddress.toLowerCase()]: PRESET_CLEAN_SAFE,
  [PRESET_ADMIN_CONCENTRATION.targetAddress.toLowerCase()]: PRESET_ADMIN_CONCENTRATION,
};

function formatShortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr || '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function deriveFindingTitle(f: RawEngineFinding): string {
  switch (f.findingType) {
    case 'ACTIVE_APPROVAL':
      return 'Active Token Approval Record';
    case 'UNLIMITED_ALLOWANCE':
      return 'Active Unlimited Token Approval';
    case 'CURRENT_TOKEN_EXPOSURE':
      return 'Current Liquid Token Exposure';
    case 'APPROVAL_WITHOUT_CURRENT_BALANCE':
      return 'Allowance Granted with Zero Liquid Balance';
    case 'PROXY_DETECTED':
      return 'Upgradeable Proxy Implementation Detected';
    case 'PRIVILEGED_ADMIN':
      return 'Privileged Admin / Owner Control';
    case 'TIMELOCK_ABSENT':
      return 'Timelock Absent on Privileged Functions';
    case 'CONTRACT_DEPENDENCY':
      return 'External Contract Dependency Identified';
    case 'TRANSACTION_COUNT':
      return 'Transaction Volume Analyzed';
    case 'FIRST_ACTIVITY':
      return 'Earliest On-Chain Activity';
    case 'LAST_ACTIVITY':
      return 'Most Recent On-Chain Activity';
    case 'CONTRACT_INTERACTION':
      return 'External Contract Interaction';
    case 'TOKEN_TRANSFER':
      return 'Settled Token Transfer Event';
    case 'ADDRESS_CLASSIFICATION':
      return 'Address Classification';
    default:
      return f.findingType.replace(/_/g, ' ');
  }
}

function deriveFindingCategory(f: RawEngineFinding): 'EXPOSURE' | 'AUTHORIZATION' | 'LOGIC' | 'GOVERNANCE' | 'ORACLE' {
  if (f.kind === 'approval' || f.kind === 'exposure') return 'EXPOSURE';
  if (f.kind === 'upgradeability') return 'LOGIC';
  if (f.kind === 'privilege') return 'GOVERNANCE';
  if (f.kind === 'dependency') return 'ORACLE';
  if (f.findingType.includes('ALLOWANCE') || f.findingType.includes('APPROVAL')) return 'AUTHORIZATION';
  if (f.findingType.includes('PROXY')) return 'LOGIC';
  if (f.findingType.includes('ADMIN') || f.findingType.includes('TIMELOCK')) return 'GOVERNANCE';
  return 'EXPOSURE';
}

function deriveFindingSummary(f: RawEngineFinding, subjectAddress: string): string {
  if (f.findingType === 'UNLIMITED_ALLOWANCE') {
    return `Target address granted maximum uint256 allowance to spender ${f.spender ? formatShortAddress(f.spender) : 'contract'}. Spender can transfer all current and future balance.`;
  }
  if (f.findingType === 'CURRENT_TOKEN_EXPOSURE') {
    return `Active token allowance coincides with a positive liquid balance. Spender holds immediate capability to withdraw exposed funds.`;
  }
  if (f.findingType === 'PROXY_DETECTED') {
    return `Contract delegates execution through proxy slot ${f.evidence?.slot ? formatShortAddress(f.evidence.slot) : 'EIP-1967'}. Logic can be upgraded to implementation ${f.implementation ? formatShortAddress(f.implementation) : 'address'}.`;
  }
  if (f.findingType === 'PRIVILEGED_ADMIN') {
    const adminKey = f.admin || f.owner;
    return `Admin privileges are concentrated in key ${adminKey ? formatShortAddress(adminKey) : 'address'} without decentralized multi-sig verification.`;
  }
  if (f.findingType === 'TIMELOCK_ABSENT') {
    return `Privileged contract administrative functions do not enforce a delay timelock, allowing instantaneous parameter modification.`;
  }
  if (f.findingType === 'CONTRACT_DEPENDENCY') {
    return `Contract depends on external contract addresses for state or oracle feeds.`;
  }
  if (f.findingType === 'TRANSACTION_COUNT') {
    return `Observed ${f.evidence?.transactionCount ?? 'multiple'} confirmed transactions on-chain.`;
  }
  if (f.findingType === 'FIRST_ACTIVITY' || f.findingType === 'LAST_ACTIVITY') {
    return `Confirmed activity recorded at block #${f.blockNumber ?? 'N/A'}.`;
  }
  if (f.findingType === 'CONTRACT_INTERACTION' || f.findingType === 'TOKEN_TRANSFER') {
    return `Settled historical ${f.findingType === 'TOKEN_TRANSFER' ? 'token transfer' : 'contract interaction'} recorded at tx ${f.transactionHash ? formatShortAddress(f.transactionHash) : 'hash'}.`;
  }
  return `On-chain diagnostic finding recorded for ${formatShortAddress(subjectAddress)}.`;
}

function deriveTripartite(f: RawEngineFinding, allUnknowns: UnknownFieldItem[]): { observed: string[]; inferred: string[]; unknown: string[] } {
  const observed: string[] = [];
  const inferred: string[] = [];
  const unknown: string[] = [];

  if (f.knowledgeType === 'OBSERVED') {
    if (f.findingType === 'UNLIMITED_ALLOWANCE') {
      observed.push(`Observed allowance register stores MAX_UINT256 for spender ${f.spender ? formatShortAddress(f.spender) : 'contract'}.`);
    } else if (f.findingType === 'PROXY_DETECTED') {
      observed.push(`EIP-1967 proxy storage slot holds implementation pointer ${f.implementation || '0x...'}.`);
    } else if (f.findingType === 'PRIVILEGED_ADMIN') {
      observed.push(`Administrative role assigned to address ${f.admin || f.owner || 'account'}.`);
    } else if (f.findingType === 'TRANSACTION_COUNT') {
      observed.push(`Observed ${f.evidence?.transactionCount ?? 0} indexed transactions on-chain.`);
    } else if (f.transactionHash) {
      observed.push(`Transaction ${formatShortAddress(f.transactionHash)} settled at block #${f.blockNumber ?? 'indexed'}.`);
    } else {
      observed.push(`State observation confirmed on ${f.chain || 'ethereum'}.`);
    }
  } else {
    observed.push(`Underlying state confirmed at block #${f.blockNumber ?? 'current'}.`);
  }

  if (f.knowledgeType === 'INFERRED' || f.findingType === 'CURRENT_TOKEN_EXPOSURE' || f.findingType === 'UNLIMITED_ALLOWANCE') {
    if (f.findingType === 'CURRENT_TOKEN_EXPOSURE') {
      inferred.push('Spender holds live authorization to transfer liquid token balance without additional signature.');
    } else if (f.findingType === 'UNLIMITED_ALLOWANCE') {
      inferred.push('Future token inflows to this address are automatically exposed to spender execution.');
    } else {
      inferred.push('Derived risk hypothesis based on active contract permissions in state.');
    }
  } else if (f.findingType === 'PROXY_DETECTED') {
    inferred.push('Implementation bytecode can be altered if proxy admin keys are compromised.');
  } else if (f.findingType === 'PRIVILEGED_ADMIN') {
    inferred.push('Single key compromise directly exposes contract admin functions.');
  } else {
    inferred.push('No malicious intent or active exploit inferred from benign historical state.');
  }

  const relatedUnknown = allUnknowns.find(u => u.field.includes(f.id) || (f.coverageGaps && f.coverageGaps.length > 0));
  if (relatedUnknown && relatedUnknown.detail) {
    unknown.push(relatedUnknown.detail);
  } else if (f.coverageGaps && f.coverageGaps[0]) {
    unknown.push(f.coverageGaps[0]);
  } else {
    unknown.push('Off-chain intent, pending mempool transactions, and private flashbots bundles are unobservable.');
  }

  return { observed, inferred, unknown };
}

function extractCurrentExposures(findings: RawEngineFinding[], subjectAddress: string): CurrentExposureItem[] {
  // "Active Vectors" must contain only genuine current exposures: findings
  // that represent actionable, revocable state right now. Passive/probe
  // findings (proxy detection, admin metadata, plain approvals) are context,
  // not exposures, and must not inflate this list or the blast radius.
  const exposureFindings = findings.filter(f =>
    f.knowledgeType === 'INFERRED' &&
    ['UNLIMITED_ALLOWANCE', 'CURRENT_TOKEN_EXPOSURE', 'APPROVAL_WITHOUT_CURRENT_BALANCE'].includes(f.findingType)
  );

  return exposureFindings.map((f, idx) => {
    let type: CurrentExposureItem['type'] = 'DANGEROUS_PERMISSION';
    if (f.findingType === 'UNLIMITED_ALLOWANCE' || f.findingType === 'CURRENT_TOKEN_EXPOSURE') {
      type = 'UNLIMITED_TOKEN_APPROVAL';
    } else if (f.findingType === 'PROXY_DETECTED') {
      type = 'UPGRADEABLE_LOGIC';
    } else if (f.findingType === 'PRIVILEGED_ADMIN' || f.findingType === 'TIMELOCK_ABSENT') {
      type = 'PRIVILEGED_ADMIN';
    }

    const severity: SeverityLevel = 
      f.severity === 'CRITICAL' ? 'CRITICAL' :
      f.severity === 'HIGH' ? 'HIGH' :
      f.severity === 'MEDIUM' ? 'MEDIUM' : 'LOW';

    let blastRadiusUsd = 0;
    if (f.explanationInputs?.currentBalance) {
      try {
        const raw = BigInt(f.explanationInputs.currentBalance);
        blastRadiusUsd = Number(raw / 10n**15n) / 1000;
      } catch {
        blastRadiusUsd = 0;
      }
    }

    return {
      id: `EXP-${f.id || idx + 1}`,
      title: deriveFindingTitle(f),
      type,
      severity,
      description: deriveFindingSummary(f, subjectAddress),
      vulnerableAsset: f.token ? {
        symbol: f.evidence?.tokenSymbol || 'TOKEN',
        amount: f.explanationInputs?.currentBalance || 'Exposed Balance',
        usdValue: blastRadiusUsd,
      } : undefined,
      governingEntity: {
        address: f.wallet || subjectAddress,
        label: 'Target Entity',
        entityType: 'WALLET_EOA',
      },
      counterparty: {
        address: f.spender || f.admin || f.implementation || '0x0000000000000000000000000000000000000000',
        label: f.spender ? 'Approved Spender' : f.admin ? 'Proxy Admin' : 'Implementation',
        entityType: 'SMART_CONTRACT',
      },
      activeSince: f.blockNumber ? `Block #${f.blockNumber}` : 'Active State',
      revocable: f.findingType.includes('ALLOWANCE') || f.findingType.includes('APPROVAL'),
      blastRadiusUsd,
      directEvidenceProof: f.evidence?.slot 
        ? `Storage slot ${f.evidence.slot} verified via RPC` 
        : f.allowance 
        ? `Allowance register = ${f.allowance}` 
        : `Verified on-chain state`,
    };
  });
}

function extractHistoricalActivities(findings: RawEngineFinding[], subjectAddress: string): HistoricalActivityItem[] {
  const histFindings = findings.filter(f => 
    f.kind === 'transaction' || 
    f.kind === 'transfer' || 
    f.kind === 'activity' ||
    ['TRANSACTION_COUNT', 'FIRST_ACTIVITY', 'LAST_ACTIVITY', 'CONTRACT_INTERACTION', 'TOKEN_TRANSFER', 'IMPORTANT_INTERACTION'].includes(f.findingType)
  ).slice(0, 100);

  return histFindings.map((f, idx) => ({
    id: `HIST-${f.id || idx + 1}`,
    timestamp: f.timestamp || new Date().toISOString(),
    transactionHash: f.transactionHash || f.evidence?.transactionHash || '0x' + '0'.repeat(64),
    blockNumber: f.blockNumber || f.evidence?.blockNumber || 0,
    actionType: (f.findingType === 'TOKEN_TRANSFER' ? 'TRANSFER' : 'CONTRACT_INTERACTION') as HistoricalActivityItem['actionType'],
    description: deriveFindingSummary(f, subjectAddress),
    counterparty: {
      address: f.contractAddress || f.wallet || '0x0000000000000000000000000000000000000000',
      label: 'Indexed Entity',
      entityType: 'SMART_CONTRACT',
    },
    valueUsd: 0,
    status: 'SETTLED',
    threatSignificance: 'BENIGN',
    note: 'Historical on-chain event. Settled transaction does NOT endanger current funds unless unrevoked permissions remain active in state.',
  }));
}

function buildEvidenceGraph(
  targetAddress: string,
  entityType: EntityType,
  findings: RawEngineFinding[]
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodesMap = new Map<string, GraphNode>();
  const edgesMap = new Map<string, GraphEdge>();

  const targetId = 'target';
  nodesMap.set(targetId, {
    id: targetId,
    label: formatShortAddress(targetAddress),
    sublabel: entityType === 'WALLET_EOA' ? 'Target Wallet' : 'Target Contract',
    type: entityType === 'WALLET_EOA' ? 'WALLET' : 'SPENDER',
    isTarget: true,
    badge: 'Target Entity',
    address: targetAddress,
  });

  for (const f of findings) {
    if (f.token) {
      const tokenId = `token-${f.token.toLowerCase()}`;
      if (!nodesMap.has(tokenId)) {
        nodesMap.set(tokenId, {
          id: tokenId,
          label: f.evidence?.tokenSymbol || formatShortAddress(f.token),
          sublabel: 'Token Asset',
          type: 'TOKEN',
          badge: f.evidence?.tokenSymbol ? `${f.evidence.tokenSymbol}` : 'ERC-20',
          address: f.token,
        });
      }
      const edgeKey = `${targetId}->${tokenId}:approval`;
      if (!edgesMap.has(edgeKey)) {
        edgesMap.set(edgeKey, {
          id: `e-tok-${edgesMap.size + 1}`,
          source: targetId,
          target: tokenId,
          relationship: f.findingType === 'UNLIMITED_ALLOWANCE' ? 'unlimited approval' : 'holds / approved asset',
          relationshipType: 'DIRECT_EVIDENCE',
          evidenceRef: f.allowance ? `Allowance: ${f.allowance.slice(0, 10)}...` : undefined,
          transactionHash: f.transactionHash,
        });
      }
    }

    if (f.spender) {
      const spenderId = `spender-${f.spender.toLowerCase()}`;
      if (!nodesMap.has(spenderId)) {
        nodesMap.set(spenderId, {
          id: spenderId,
          label: formatShortAddress(f.spender),
          sublabel: 'Approved Spender',
          type: 'SPENDER',
          badge: 'Spender Contract',
          address: f.spender,
        });
      }
      const edgeKey = `${targetId}->${spenderId}:allowance`;
      if (!edgesMap.has(edgeKey)) {
        edgesMap.set(edgeKey, {
          id: `e-sp-${edgesMap.size + 1}`,
          source: targetId,
          target: spenderId,
          relationship: 'authorized spender',
          relationshipType: 'DIRECT_EVIDENCE',
          evidenceRef: f.evidence?.slot ? `Slot ${formatShortAddress(f.evidence.slot)}` : undefined,
          transactionHash: f.transactionHash,
        });
      }
    }

    const adminAddr = f.admin || f.owner;
    if (adminAddr) {
      const adminId = `admin-${adminAddr.toLowerCase()}`;
      if (!nodesMap.has(adminId)) {
        nodesMap.set(adminId, {
          id: adminId,
          label: formatShortAddress(adminAddr),
          sublabel: f.admin ? 'Proxy Admin' : 'Contract Owner',
          type: 'ADMIN',
          badge: 'Privileged Role',
          address: adminAddr,
        });
      }
      const parentId = f.spender ? `spender-${f.spender.toLowerCase()}` : targetId;
      const edgeKey = `${parentId}->${adminId}:admin`;
      if (!edgesMap.has(edgeKey)) {
        edgesMap.set(edgeKey, {
          id: `e-adm-${edgesMap.size + 1}`,
          source: parentId,
          target: adminId,
          relationship: f.admin ? 'controlled by proxy admin' : 'owned by admin key',
          relationshipType: f.knowledgeType === 'INFERRED' ? 'INFERRED' : 'DIRECT_EVIDENCE',
          evidenceRef: 'Admin authority record',
        });
      }
    }

    if (f.implementation) {
      const implId = `impl-${f.implementation.toLowerCase()}`;
      if (!nodesMap.has(implId)) {
        nodesMap.set(implId, {
          id: implId,
          label: formatShortAddress(f.implementation),
          sublabel: 'Proxy Implementation',
          type: 'IMPLEMENTATION',
          badge: 'Implementation',
          address: f.implementation,
        });
      }
      const parentId = f.spender ? `spender-${f.spender.toLowerCase()}` : targetId;
      const edgeKey = `${parentId}->${implId}:impl`;
      if (!edgesMap.has(edgeKey)) {
        edgesMap.set(edgeKey, {
          id: `e-impl-${edgesMap.size + 1}`,
          source: parentId,
          target: implId,
          relationship: 'delegates execution to',
          relationshipType: 'DIRECT_EVIDENCE',
          evidenceRef: f.evidence?.slot ? `Slot ${formatShortAddress(f.evidence.slot)}` : 'EIP-1967 delegatecall',
        });
      }
    }
  }

  return {
    nodes: Array.from(nodesMap.values()),
    edges: Array.from(edgesMap.values()),
  };
}

export function adaptAnalyzeResponse(
  data: AnalyzeApiResponse,
  requestedChain: NetworkChainId
): InvestigationReport {
  const targetAddress = data.subject.address;
  const isContract = data.subject.addressType === 'SMART_CONTRACT' || data.findings.some(f => f.findingType === 'PROXY_DETECTED');
  const hasProxy = data.findings.some(f => f.findingType === 'PROXY_DETECTED');
  const entityType: EntityType = hasProxy ? 'PROXY_CONTRACT' : isContract ? 'SMART_CONTRACT' : 'WALLET_EOA';

  const chainInfo = SUPPORTED_CHAINS[requestedChain] || SUPPORTED_CHAINS.ethereum;

  const findings: Finding[] = data.findings.map((rf) => {
    const tripartite = deriveTripartite(rf, data.unknowns || []);
    const severity: SeverityLevel = 
      rf.severity === 'CRITICAL' ? 'CRITICAL' :
      rf.severity === 'HIGH' ? 'HIGH' :
      rf.severity === 'MEDIUM' ? 'MEDIUM' :
      rf.severity === 'LOW' ? 'LOW' : 'INFORMATIONAL';

    let dollarAtRisk: number | undefined;
    if (rf.explanationInputs?.currentBalance) {
      try {
        const raw = BigInt(rf.explanationInputs.currentBalance);
        dollarAtRisk = Number(raw / 10n**15n) / 1000;
      } catch {
        dollarAtRisk = undefined;
      }
    }

    return {
      id: rf.id,
      findingType: rf.findingType,
      severity,
      confidence: rf.knowledgeType,
      title: deriveFindingTitle(rf),
      summary: deriveFindingSummary(rf, targetAddress),
      category: deriveFindingCategory(rf),
      tripartite,
      token: rf.token ? {
        address: rf.token,
        symbol: rf.evidence?.tokenSymbol || 'TOKEN',
        name: rf.evidence?.tokenSymbol || 'Token',
        decimals: 18,
        usdPrice: 1,
      } : undefined,
      spender: rf.spender ? {
        address: rf.spender,
        label: 'Spender Contract',
        entityType: 'SMART_CONTRACT',
      } : undefined,
      allowance: rf.allowance,
      dollarAtRisk,
      evidence: {
        transactionHash: rf.transactionHash || rf.evidence?.transactionHash,
        blockNumber: rf.blockNumber || rf.evidence?.blockNumber,
        timestamp: rf.timestamp || rf.evidence?.timestamp,
        contractAddress: rf.contractAddress || rf.evidence?.contractAddress,
        spender: rf.spender ? { address: rf.spender, entityType: 'SMART_CONTRACT' } : undefined,
        token: rf.token ? { address: rf.token, symbol: rf.evidence?.tokenSymbol || 'TOKEN', name: 'Token', decimals: 18, usdPrice: 1 } : undefined,
        allowanceAmount: rf.allowance,
        formattedAllowance: rf.allowance && (rf.allowance.startsWith('0xfff') || rf.allowance.includes('ffff')) ? 'MAX_UINT256 (Unlimited)' : rf.allowance,
        rawCalldata: rf.evidence?.rawCalldata || rf.evidence?.calldata,
        stateSlot: rf.evidence?.slot,
        verificationMethod: rf.evidence?.slot ? 'RPC_STATE_CALL' : rf.transactionHash ? 'EVENT_LOG_PROOF' : 'RPC_STATE_CALL',
      },
      remediation: rf.findingType.includes('ALLOWANCE') || rf.findingType === 'CURRENT_TOKEN_EXPOSURE' ? {
        actionText: 'Revoke token allowance to eliminate spender blast radius',
        actionType: 'REVOKE_APPROVAL',
        contractToCall: rf.token,
      } : undefined,
    };
  });

  const currentExposures = extractCurrentExposures(data.findings, targetAddress);
  const historicalActivities = extractHistoricalActivities(data.findings, targetAddress);
  const evidenceGraph = buildEvidenceGraph(targetAddress, entityType, data.findings);

  const observedFactsCount = data.findings.filter(f => f.knowledgeType === 'OBSERVED').length;
  const inferredHypothesesCount = data.findings.filter(f => f.knowledgeType === 'INFERRED').length;
  const unknownBoundariesCount = data.findings.filter(f => f.knowledgeType === 'UNKNOWN').length + (data.unknowns?.length || 0);
  const criticalFindingsCount = findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH').length;

  const totalBlastRadiusUsd = currentExposures.reduce((acc, curr) => acc + (curr.blastRadiusUsd || 0), 0);

  const coverage: CoverageReport = {
    ...COMMON_COVERAGE,
    limitations: [
      ...((data.coverageGaps && data.coverageGaps.length > 0) ? data.coverageGaps : []),
      ...((data.unknowns && data.unknowns.length > 0) ? data.unknowns.map(u => `${u.field} [${u.reason}]: ${u.detail || 'epistemic boundary'}`) : []),
      ...COMMON_COVERAGE.limitations,
    ],
  };

  return {
    targetAddress,
    chain: chainInfo,
    entityType,
    investigatedAt: data.evidence?.assembledAt || new Date().toISOString(),
    totalBlastRadiusUsd,
    summary: {
      observedFactsCount,
      inferredHypothesesCount,
      unknownBoundariesCount,
      activeExposuresCount: currentExposures.length,
      criticalFindingsCount,
    },
    currentExposures,
    historicalActivities,
    findings,
    evidenceGraph,
    coverage,
    dataMode: data.dataMode,
    explanation: data.explanation,
    unknowns: data.unknowns,
    coverageGaps: data.coverageGaps,
  };
}

// Clean Service Interface
export class SentinelService {
  /**
   * Performs an investigation for an EVM address on a given chain using the real backend API.
   */
  public static async investigateAddress(
    address: string,
    chain: NetworkChainId = 'ethereum'
  ): Promise<InvestigationReport> {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    const endpoint = `${apiBase}/api/v1/analyze`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: address.trim(),
        chain,
      }),
    });

    if (!res.ok) {
      let errorMsg = `Analysis request failed with status ${res.status}`;
      try {
        const errorJson = await res.json();
        if (errorJson && errorJson.error) {
          errorMsg = errorJson.error;
        }
      } catch {
        // fallback to default errorMsg
      }
      throw new Error(errorMsg);
    }

    const data: AnalyzeApiResponse = await res.json();
    return adaptAnalyzeResponse(data, chain);
  }

  /**
   * Retrieves a preserved preset demo report for explicit quick-preset usage.
   */
  public static getPreset(
    addressOrKey: string,
    chain: NetworkChainId = 'ethereum'
  ): InvestigationReport {
    const normalized = addressOrKey.trim().toLowerCase();
    const preset = INVESTIGATION_PRESETS[normalized] || PRESET_COMPROMISED_WALLET;
    return {
      ...preset,
      chain: SUPPORTED_CHAINS[chain] || preset.chain,
      investigatedAt: new Date().toISOString(),
      dataMode: 'PRESET',
    };
  }
}
