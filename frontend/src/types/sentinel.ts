// Sentinel Web3 Security & Protocol Health - Core Type Definitions
// Follows strict separation of OBSERVED, INFERRED, and UNKNOWN confidence classes

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export type ConfidenceClass = 'OBSERVED' | 'INFERRED' | 'UNKNOWN';

export type EntityType = 
  | 'WALLET_EOA' 
  | 'SMART_CONTRACT' 
  | 'PROXY_CONTRACT' 
  | 'MULTISIG_SAFE' 
  | 'TOKEN_ERC20' 
  | 'VAULT_ERC4626'
  | 'TRANSACTION';

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
  providerOrSource?: string;
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
    | 'SUSPICIOUS_CONTRACT_INTERACTION'
    | 'ACTIVE_APPROVAL'
    | 'CURRENT_TOKEN_EXPOSURE'
    | 'PROXY_DETECTED'
    | 'PRIVILEGED_ADMIN'
    | 'CONTRACT_INTERACTION'
    | 'TOKEN_TRANSFER'
    | 'NO_ACTIVE_FINDINGS'
    | string;
  severity: SeverityLevel;
  confidence: ConfidenceClass;
  title: string;
  summary: string;
  category: 'EXPOSURE' | 'AUTHORIZATION' | 'LOGIC' | 'GOVERNANCE' | 'ORACLE' | 'ACTIVITY';
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
  status?: ConfidenceClass;
  unknownReason?: string;
}

// Distinct Historical Activity Item (what happened in the past - does NOT equal present exposure)
export interface HistoricalActivityItem {
  id: string;
  timestamp: string;
  transactionHash: string;
  blockNumber: number;
  actionType: 'SWAP' | 'TRANSFER' | 'APPROVAL' | 'CONTRACT_DEPLOY' | 'ADMIN_CHANGE' | 'DEPOSIT' | 'CONTRACT_INTERACTION';
  description: string;
  counterparty: AddressRef;
  valueUsd: number;
  status: 'SETTLED' | 'FAILED';
  threatSignificance: 'BENIGN' | 'RESOLVED_EVENT' | 'PRIOR_ANOMALY' | 'CRITICAL_INTERACTION';
  note: string; // explicitly explains why this is historical and not current active exposure
  fromAddress?: string;
  toAddress?: string;
  tokenTransfers?: Array<{
    token: string;
    symbol?: string;
    amount: string;
    from: string;
    to: string;
  }>;
  contractInteraction?: {
    method?: string;
    selector?: string;
    calldata?: string;
  };
  evidenceId?: string;
}

// SECTION 4: Active Security Vector
export interface ActiveSecurityVector {
  id: string;
  title: string;
  token?: string;
  tokenSymbol?: string;
  spender?: string;
  spenderLabel?: string;
  implementation?: string;
  admin?: string;
  status: ConfidenceClass; // OBSERVED | INFERRED | UNKNOWN
  statusReason?: string;
  evidenceRef?: string;
}

// SECTION 5: Blast Radius Visualization & Model
export interface BlastRadiusFlowStep {
  id: string;
  label: string;
  sublabel?: string;
  type: 'WALLET' | 'TOKEN' | 'ALLOWANCE' | 'SPENDER' | 'UPGRADEABLE_CONTRACT' | 'ADMIN';
  address?: string;
  note?: string;
}

export interface BlastRadiusModel {
  flowSteps: BlastRadiusFlowStep[];
  assetsPotentiallyExposed: Array<{
    symbol: string;
    balance: string;
    potentialExposureUsd?: number;
    status: string;
  }>;
  contractsInvolved: Array<{
    address: string;
    name?: string;
    role?: string;
  }>;
  permissionsInvolved: Array<{
    name: string;
    target: string;
    description: string;
  }>;
  privilegedActors: Array<{
    address: string;
    role: string;
    keyType?: string;
  }>;
  chains: string[];
  coverageGaps: string[];
}

// SECTION 3: Current Exposure Model
export interface CurrentExposureAllowance {
  token: string;
  symbol: string;
  balance: string;
  allowance: string;
  spender: string;
  spenderLabel?: string;
  isUnlimited: boolean;
  status?: ConfidenceClass;
  unknownReason?: string;
}

export interface CurrentExposureDetails {
  activeAllowances: CurrentExposureAllowance[];
  activePermissions: Array<{
    role: string;
    holder: string;
    holderLabel?: string;
    capabilities: string[];
    status?: ConfidenceClass;
  }>;
  upgradeability: {
    isUpgradeable: boolean;
    proxyType?: string;
    implementation?: string;
    admin?: string;
    timelockDelay?: string;
    status: ConfidenceClass;
    unknownReason?: string;
  };
  adminControl: {
    adminAddress?: string;
    isMultisig?: boolean;
    threshold?: string;
    status: ConfidenceClass;
    unknownReason?: string;
  };
  exposedAssets: Array<{
    symbol: string;
    balance: string;
    allowanceText?: string;
    spender?: string;
    status: ConfidenceClass;
    unknownReason?: string;
  }>;
  contractRelationships: Array<{
    source: string;
    relationship: string;
    target: string;
    type?: string;
  }>;
  unknowns: Array<{
    field: string;
    reason: string;
    detail?: string;
  }>;
}

// SECTION 6: Structured Evidence Item
export interface StructuredEvidenceItem {
  id: string;
  findingId: string;
  claim: string;
  transactionHash?: string;
  blockNumber?: number;
  contractAddress?: string;
  tokenAddress?: string;
  allowance?: string;
  ownerOrAdmin?: string;
  implementation?: string;
  relevantLogs?: string[];
  providerOrSource: string;
  verificationMethod: string;
  rawProof?: string;
}

// SECTION 8: AI Grounded Explanation
export interface GroundedExplanation {
  text: string;
  blocked: boolean;
  refused: string | null;
  citations: Record<string, string>; // e.g. { "1": "E1", "2": "E2" }
  knowledgeByCitation: Record<string, ConfidenceClass>;
  validation: {
    clean: boolean;
    strippedCitations: string[];
    unsupportedClaims: string[];
  };
}

// SECTION 10: Structured Failure State
export interface InvestigationFailure {
  isUnavailable: boolean;
  provider: string; // e.g. "Ethereum RPC"
  reason: string; // e.g. "Rate limit / RPC error / insufficient coverage"
  coverageGap: string; // e.g. "Current allowance could not be verified."
  failedTarget?: string;
  rawError?: string;
}

// Protocol Health Diagnostic
export interface ProtocolHealth {
  protocolName: string;
  protocolSlug: string;
  isDemoData: boolean;
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

// SECTION 7: Graph Representation
export interface GraphNode {
  id: string;
  label: string;
  sublabel?: string;
  type: 'WALLET' | 'TOKEN' | 'SPENDER' | 'CONTRACT' | 'ADMIN' | 'IMPLEMENTATION' | 'ORACLE';
  address?: string;
  badge?: string;
  isTarget?: boolean;
}

export type EdgeRelationship = 
  | 'APPROVED'
  | 'ALLOWANCE'
  | 'CONTROLLED_BY'
  | 'UPGRADEABLE_TO'
  | 'TRANSFERRED_TO'
  | 'INTERACTED_WITH'
  | string;

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: EdgeRelationship;
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
  targetType: 'ADDRESS' | 'TRANSACTION';
  chain: ChainInfo;
  entityType: EntityType;
  ensName?: string;
  contractName?: string;
  investigatedAt: string;
  totalBlastRadiusUsd: number;
  
  // SECTION 1 Concise State
  summary: {
    observedFactsCount: number;
    inferredHypothesesCount: number;
    unknownBoundariesCount: number;
    activeExposuresCount: number;
    criticalFindingsCount: number;
    historicalFindingLabel?: string;
    currentExposureLabel?: string;
    activeVectorsLabel?: string;
    blastRadiusLabel?: string;
  };

  // Transaction Specifics (if investigating transaction)
  transactionDetails?: {
    hash: string;
    blockNumber: number;
    from: string;
    to: string;
    timestamp: string;
    valueEth?: string;
    gasUsed?: string;
    status?: 'SUCCESS' | 'REVERTED';
  };

  // SECTION 2: History (What Happened)
  historicalActivities: HistoricalActivityItem[];

  // SECTION 3: Current Exposure
  currentExposures: CurrentExposureItem[];
  currentExposureDetails?: CurrentExposureDetails;

  // SECTION 4: Active Security Vectors
  activeSecurityVectors?: ActiveSecurityVector[];

  // SECTION 5: Blast Radius
  blastRadiusDetails?: BlastRadiusModel;

  // SECTION 6: Findings & Evidence
  findings: Finding[];
  evidenceList?: StructuredEvidenceItem[];

  // SECTION 7: Evidence Graph
  evidenceGraph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };

  // SECTION 8: AI Explanation
  explanation?: GroundedExplanation;

  // Protocol Health & Coverage
  protocolHealth?: ProtocolHealth;
  coverage: CoverageReport;

  // Epistemic Bounds & Metadata
  unknowns?: Array<{ field: string; reason: string; detail?: string }>;
  coverageGaps?: string[];
  dataMode?: string;
  failureState?: InvestigationFailure;
}
