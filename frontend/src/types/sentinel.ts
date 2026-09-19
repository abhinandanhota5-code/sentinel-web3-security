// Sentinel Web3 Security & Protocol Health - Core Type Definitions
// Follows strict separation of OBSERVED, INFERRED, and UNKNOWN confidence classes

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export type ConfidenceClass = 'OBSERVED' | 'INFERRED' | 'UNKNOWN';

export type EntityType = 'WALLET_EOA' | 'SMART_CONTRACT' | 'PROXY_CONTRACT' | 'MULTISIG_SAFE' | 'TOKEN_ERC20' | 'VAULT_ERC4626';

export type NetworkChainId = 'ethereum' | 'arbitrum' | 'base' | 'multipli' | 'optimism' | 'polygon';

export interface ChainInfo {
  id: NetworkChainId;
  name: string;
  icon: string;
  blockExplorer: string;
  nativeCurrency: string;
  rpcStatus: 'ACTIVE' | 'SYNCED' | 'DELAYED';
  latestBlock: number;
}

export interface TokenDetails {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  usdPrice: number;
  logoUrl?: string;
}

export interface AddressRef {
  address: string;
  label?: string;
  entityType: EntityType;
  ens?: string;
  verifiedSource?: boolean;
}

// Structured Evidence Unit
export interface EvidenceDetails {
  transactionHash?: string;
  blockNumber?: number;
  timestamp?: string;
  contractAddress?: string;
  token?: TokenDetails;
  spender?: AddressRef;
  allowanceAmount?: string;
  formattedAllowance?: string;
  rawCalldata?: string;
  stateSlot?: string;
  storageDiff?: {
    before: string;
    after: string;
  };
  eventSignature?: string;
  verificationMethod: 'RPC_STATE_CALL' | 'EVENT_LOG_PROOF' | 'BYTECODE_DECOMPILATION' | 'TX_RECEIPT' | 'HEURISTIC_RULE';
}

// Tripartite Reasoning breakdown
export interface TripartiteReasoning {
  observed: string[];
  inferred: string[];
  unknown: string[];
}

// Core Finding Object
export interface Finding {
  id: string;
  findingType: 
    | 'UNLIMITED_ALLOWANCE'
    | 'UPGRADEABLE_PROXY_RISK'
    | 'ADMIN_KEY_CONCENTRATION'
    | 'ZERO_TIMELOCK_PRIVILEGE'
    | 'PERMIT2_SWEEP_EXPOSURE'
    | 'ORACLE_MANIPULATION_DEPENDENCY'
    | 'SUSPICIOUS_TRANSFER_BURST'
    | 'UNVERIFIED_IMPLEMENTATION'
    | 'NO_ACTIVE_FINDINGS';
  severity: SeverityLevel;
  confidence: ConfidenceClass;
  title: string;
  summary: string;
  category: 'EXPOSURE' | 'AUTHORIZATION' | 'LOGIC' | 'GOVERNANCE' | 'ORACLE';
  tripartite: TripartiteReasoning;
  token?: TokenDetails;
  spender?: AddressRef;
  allowance?: string;
  dollarAtRisk?: number;
  evidence: EvidenceDetails;
  remediation?: {
    actionText: string;
    actionType: 'REVOKE_APPROVAL' | 'TRANSFER_ASSETS' | 'UPDATE_TIMELOCK' | 'UPGRADE_MULTISIG' | 'MONITOR_ONLY';
    contractToCall?: string;
    suggestedCalldata?: string;
  };
}

// Distinct Current Exposure Item (what can drain or affect funds RIGHT NOW)
export interface CurrentExposureItem {
  id: string;
  title: string;
  type: 'UNLIMITED_TOKEN_APPROVAL' | 'UPGRADEABLE_LOGIC' | 'PRIVILEGED_ADMIN' | 'DANGEROUS_PERMISSION' | 'DEPENDENCY_EXPOSURE';
  severity: SeverityLevel;
  description: string;
  vulnerableAsset?: {
    symbol: string;
    amount: string;
    usdValue: number;
  };
  governingEntity: AddressRef;
  counterparty: AddressRef;
  activeSince: string;
  revocable: boolean;
  blastRadiusUsd: number;
  directEvidenceProof: string; // e.g. "Storage slot 0x3... holds MAX_UINT256"
}

// Distinct Historical Activity Item (what happened in the past - does NOT equal present exposure)
export interface HistoricalActivityItem {
  id: string;
  timestamp: string;
  transactionHash: string;
  blockNumber: number;
  actionType: 'SWAP' | 'TRANSFER' | 'APPROVAL' | 'CONTRACT_DEPLOY' | 'ADMIN_CHANGE' | 'DEPOSIT';
  description: string;
  counterparty: AddressRef;
  valueUsd: number;
  status: 'SETTLED' | 'FAILED';
  threatSignificance: 'BENIGN' | 'RESOLVED_EVENT' | 'PRIOR_ANOMALY';
  note: string; // explicitly explains why this is historical and not current active exposure
}

// Protocol Health Diagnostic
export interface ProtocolHealth {
  protocolName: string;
  protocolSlug: string;
  isDemoData: boolean; // Transparency: must be clearly labeled
  adminConcentration: {
    multisigRequiredSigners: number;
    multisigTotalSigners: number;
    thresholdPercentage: number;
    timelockDelayHours: number;
    guardianCanVeto: boolean;
    status: 'OPTIMAL' | 'MODERATE_RISK' | 'CRITICAL_CONCENTRATION';
    details: string;
  };
  upgradeability: {
    proxyType: 'UUPS' | 'TRANSPARENT' | 'DIAMOND_ERC2535' | 'IMMUTABLE';
    implementationAddress: string;
    upgradeAdmin: AddressRef;
    upgradeDelayHours: number;
    timelockActive: boolean;
    verificationStatus: 'VERIFIED' | 'UNVERIFIED';
    status: 'OPTIMAL' | 'WARN_UPGRADEABLE' | 'CENTRALIZED_CONTROL';
  };
  privilegedPermissions: Array<{
    role: string;
    holder: AddressRef;
    capabilities: string[];
    canDrainFunds: boolean;
    timelocked: boolean;
  }>;
  contractDependencies: Array<{
    name: string;
    category: 'ORACLE' | 'DEX_ROUTER' | 'BRIDGE' | 'LENDING_POOL';
    address: string;
    criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    healthStatus: 'HEALTHY' | 'VOLATILE' | 'DEGRADED';
    failureImpact: string;
  }>;
  activityAnomalies: Array<{
    type: string;
    detectedAt: string;
    description: string;
    deviationScore: string;
    source: 'FORTA_BOT' | 'HYPERNATIVE_FEED' | 'MULTIPLI_ANALYZER';
  }>;
  totalValueLockedUsd: number;
  totalExposedValueUsd: number;
  overallHealthGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

// Graph Representation
export interface GraphNode {
  id: string;
  label: string;
  sublabel?: string;
  type: 'WALLET' | 'TOKEN' | 'SPENDER' | 'ADMIN' | 'IMPLEMENTATION' | 'ORACLE';
  address?: string;
  badge?: string;
  isTarget?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  relationshipType: 'DIRECT_EVIDENCE' | 'INFERRED';
  evidenceRef?: string;
  transactionHash?: string;
}

// Coverage and Bounds
export interface CoverageReport {
  networksChecked: Array<{
    chain: string;
    status: 'VERIFIED' | 'PARTIAL' | 'UNSUPPORTED';
    latestBlockIndexed: number;
  }>;
  analysisModules: Array<{
    id: string;
    name: string;
    description: string;
    status: 'ACTIVE' | 'DEGRADED';
    lastRunLatencyMs: number;
  }>;
  dataSources: Array<{
    name: string;
    provider: string;
    type: 'RPC_ARCHIVE' | 'BOT_TELEMETRY' | 'BYTECODE_ANALYZER' | 'INDEXER';
    freshness: string;
  }>;
  limitations: string[];
  disclaimer: string;
}

// Complete Investigation Report Payload
export interface InvestigationReport {
  targetAddress: string;
  chain: ChainInfo;
  entityType: EntityType;
  ensName?: string;
  contractName?: string;
  investigatedAt: string;
  totalBlastRadiusUsd: number;
  summary: {
    observedFactsCount: number;
    inferredHypothesesCount: number;
    unknownBoundariesCount: number;
    activeExposuresCount: number;
    criticalFindingsCount: number;
  };
  currentExposures: CurrentExposureItem[];
  historicalActivities: HistoricalActivityItem[];
  findings: Finding[];
  evidenceGraph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  protocolHealth?: ProtocolHealth;
  coverage: CoverageReport;
}
