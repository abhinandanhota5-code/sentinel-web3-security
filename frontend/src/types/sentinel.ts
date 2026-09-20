// Sentinel Web3 Security & Protocol Health - Core Type Definitions
// Follows strict separation of OBSERVED, INFERRED, and UNKNOWN confidence classes

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL' | 'UNKNOWN';

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
export type FindingStatus = 'ACTIVE' | 'HISTORICAL' | 'UNKNOWN';

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
    | 'NO_ACTIVE_FINDINGS'
    | (string & {});
  severity: SeverityLevel;
  confidence: ConfidenceClass;
  /** Temporal state: ACTIVE = current exposure, HISTORICAL = settled event, UNKNOWN = unverifiable. Derived deterministically from finding type + evidence, never from the LLM. Optional for legacy preset reports. */
  status?: FindingStatus;
  /** Stable evidence record ids supporting this finding (== engine record id). Optional for legacy preset reports. */
  evidenceIds?: string[];
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
export type GraphNodeType =
  | 'WALLET'
  | 'TOKEN'
  | 'SPENDER'
  | 'CONTRACT'
  | 'ADMIN'
  | 'IMPLEMENTATION'
  | 'ORACLE'
  | 'DELEGATED_TARGET';

export interface GraphNode {
  id: string;
  label: string;
  sublabel?: string;
  type: GraphNodeType;
  address?: string;
  badge?: string;
  isTarget?: boolean;
}

/** Canonical relationship labels — every edge must map to real evidence. */
export type GraphRelationshipType =
  | 'HOLDS'
  | 'APPROVED'
  | 'ALLOWANCE'
  | 'INTERACTED_WITH'
  | 'DELEGATES_TO'
  | 'CONTROLLED_BY'
  | 'UPGRADEABLE_TO'
  | 'TRANSFERRED_TO'
  | 'DEPENDS_ON'
  | (string & {});

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: GraphRelationshipType;
  relationshipType: 'DIRECT_EVIDENCE' | 'INFERRED';
  /** Stable engine evidence record ids supporting this relationship. */
  evidenceIds?: string[];
  /** Number of aggregated evidence records (e.g. 30 interactions → one edge, count 30). */
  count?: number;
  evidenceRef?: string;
  transactionHash?: string;
}

/** One consolidated evidence record for the Evidence view. */
export interface EvidenceRecordView {
  id: string;
  kind: string;
  chain?: string;
  knowledgeType: ConfidenceClass;
  sourceTool?: string;
  sourceLocator?: string;
  capturedAt?: string;
  findingType?: string;
  title?: string;
  summary?: string;
  detail?: Record<string, unknown>;
  coverageGaps?: string[];
}

/** Deterministic current-state summary produced by the engine (not the LLM). */
export interface CurrentExposureSummary {
  nativeBalanceWei: string | null;
  eip7702: {
    delegatedTo?: string;
    delegatedToIsContract?: boolean;
    delegatedToCodeSizeBytes?: number;
    evidenceId?: string;
  } | null;
  tokens: Array<{ token: string | null; symbol: string | null; balance: string; positive: boolean }>;
  activeVectors: Array<{ type: string; token?: string | null; symbol?: string | null; balance?: string }>;
  blastRadius: { tokenWeiTotal: string; note?: string };
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

export type DataMode = 'REAL' | 'DEMO' | 'MIXED' | 'PRESET' | 'UNSPECIFIED';

export interface GroundedExplanation {
  text: string;
  blocked?: boolean;
  refused?: string | null;
  /** Exact sanitized provider failure detail when refused === 'provider_error'. */
  providerError?: string;
  /** Machine-readable failure classification (OLLAMA_UNAVAILABLE, MODEL_NOT_FOUND, TIMEOUT, INVALID_RESPONSE). */
  providerCode?: string;
  citations: Record<string, string>;
  knowledgeByCitation: Record<string, ConfidenceClass>;
  validation?: {
    clean: boolean;
    strippedCitations: string[];
    unsupportedClaims: string[];
  };
}

export interface UnknownFieldItem {
  field: string;
  reason: string;
  detail?: string;
}

export interface RawEngineFinding {
  id: string;
  kind?: string;
  findingType: string;
  knowledgeType: ConfidenceClass;
  severity?: string;
  entity?: string;
  chain?: string;
  wallet?: string;
  contractAddress?: string;
  token?: string;
  spender?: string;
  allowance?: string;
  owner?: string;
  admin?: string;
  role?: string;
  implementation?: string;
  transactionHash?: string;
  blockNumber?: number;
  timestamp?: string;
  relevantContractAddresses?: string[];
  evidence?: Record<string, any>;
  sourceReferences?: Record<string, any>;
  explanationInputs?: Record<string, any>;
  coverageGaps?: string[];
}

export interface AnalyzeApiResponse {
  subject: {
    chain: string;
    address: string;
    addressType: string | null;
  };
  investigation?: {
    address: string;
    chain: string;
    addressType: string | null;
    dataMode: string | null;
    engine: string;
  };
  history?: {
    transactionCount: number | null;
    contractInteractions: number;
    tokenTransfers: number;
  };
  currentExposure?: {
    nativeBalanceWei: string | null;
    eip7702: {
      delegatedTo?: string;
      delegatedToIsContract?: boolean;
      delegatedToCodeSizeBytes?: number;
    } | null;
    tokens: Array<{ token: string | null; symbol: string | null; balance: string; positive: boolean; knowledgeType?: string | null }>;
  };
  activeVectors?: Array<{ type: string; token?: string | null; symbol?: string | null; balance?: string }>;
  blastRadius?: { tokenWeiTotal: string; note?: string };
  engineUnknowns?: Array<{ findingType: string | null; detail: string | null }>;
  findings: RawEngineFinding[];
  evidence: {
    subject: {
      chain: string;
      address: string;
    };
    assembledAt: string;
    records: unknown[];
    engineVersion: string;
  };
  explanation: GroundedExplanation;
  coverageGaps: string[];
  unknowns: UnknownFieldItem[];
  dataMode: DataMode;
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
  dataMode?: DataMode;
  explanation?: GroundedExplanation;
  unknowns?: UnknownFieldItem[];
  coverageGaps?: string[];
  /** Consolidated evidence records for the dedicated Evidence view. */
  evidenceRecords?: EvidenceRecordView[];
  /** Deterministic current-state summary from the engine (ETH balance, 7702, tokens). */
  currentExposureSummary?: CurrentExposureSummary;
}
