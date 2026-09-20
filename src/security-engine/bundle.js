const { STATUSES, SEVERITIES } = require('./evidence');

const BUNDLE_VERSION = '1.0';

const KIND_BY_FINDING = Object.freeze({
  ACTIVE_APPROVAL: 'approval',
  UNLIMITED_ALLOWANCE: 'approval',
  CURRENT_TOKEN_EXPOSURE: 'exposure',
  APPROVAL_WITHOUT_CURRENT_BALANCE: 'exposure',
  PROXY_DETECTED: 'upgradeability',
  UPGRADE_AUTHORITY: 'privilege',
  PRIVILEGED_ADMIN: 'privilege',
  ADMIN_CONCENTRATION: 'privilege',
  CONTRACT_DEPENDENCY: 'dependency',
  CONTRACT_INTERACTION: 'transaction',
  TOKEN_TRANSFER: 'transfer',
  IMPORTANT_INTERACTION: 'transaction',
  ABNORMAL_CHANGE: 'activity',
  SUSPICIOUS_ACTIVITY: 'activity',
  EXTERNAL_INTELLIGENCE_MATCH: 'external_intelligence',
  SUSPECT_TRANSACTION_OUTBOUND: 'network_exposure',
  SUSPECT_TRANSACTION_INBOUND: 'network_exposure'
});

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function sourceReferences(evidence) {
  return Object.fromEntries(Object.entries(evidence).filter(([key]) => [
    'transactionHash', 'blockNumber', 'timestamp', 'contractAddress', 'tokenAddress', 'spenderAddress', 'allowance', 'ownerAddress', 'adminAddress', 'implementationAddress'
  ].includes(key)));
}

function normalizeFinding(item, index, defaultChain, subject) {
  if (!item || !STATUSES.includes(item.status)) throw new Error(`Invalid finding status at index ${index}`);
  if (!SEVERITIES.includes(item.severity)) throw new Error(`Invalid finding severity at index ${index}`);
  const evidence = item.evidence || {};
  const limitations = Array.isArray(item.limitations) ? item.limitations : [];
  const kind = KIND_BY_FINDING[item.findingType] || item.findingType.toLowerCase();
  return {
    id: `E${index + 1}`,
    kind,
    findingType: item.findingType,
    knowledgeType: item.status,
    severity: item.severity,
    entity: item.entity,
    chain: item.chain || defaultChain,
    wallet: firstDefined(evidence.walletAddress, subject.address),
    contractAddress: evidence.contractAddress,
    token: firstDefined(evidence.tokenAddress, evidence.token),
    spender: firstDefined(evidence.spenderAddress, evidence.spender),
    allowance: evidence.allowance,
    owner: firstDefined(evidence.ownerAddress, evidence.owner),
    admin: firstDefined(evidence.adminAddress, evidence.admin),
    role: evidence.role,
    implementation: firstDefined(evidence.implementationAddress, evidence.implementation),
    transactionHash: evidence.transactionHash,
    blockNumber: evidence.blockNumber,
    timestamp: evidence.timestamp,
    relevantContractAddresses: firstDefined(evidence.dependencyAddresses, evidence.contractAddresses),
    evidence,
    sourceReferences: sourceReferences(evidence),
    explanationInputs: item.explanationInputs || {},
    coverageGaps: limitations
  };
}

function createEvidenceBundle(result) {
  if (!result || !Array.isArray(result.findings)) throw new Error('Security analysis result with findings is required');
  const chain = result.chain || result.protocol?.chain;
  const subject = result.protocol ? { protocol: result.protocol } : { address: result.address, addressType: result.addressType };
  const evidence = result.findings.map((item, index) => normalizeFinding(item, index, chain, subject));
  return {
    schemaVersion: BUNDLE_VERSION,
    bundleType: 'SENTINEL_EVIDENCE',
    dataMode: result.dataMode || 'UNSPECIFIED',
    chain,
    address: result.address,
    addressType: result.addressType,
    protocol: result.protocol,
    subject,
    evidence,
    coverageGaps: [...new Set(evidence.flatMap((item) => item.coverageGaps))]
  };
}

module.exports = { BUNDLE_VERSION, createEvidenceBundle, normalizeFinding };