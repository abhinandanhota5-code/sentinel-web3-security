const { analyzeAddress } = require('./address');
const { analyzeHistory } = require('./history');
const { analyzeApprovals } = require('./approvals');
const { analyzeContract, analyzeUpgradeability } = require('./contracts');
const { analyzeProtocol } = require('./protocol');
const { createEvidenceBundle } = require('./bundle');
const { analyzeCurrentState, analyzeTokenExposure } = require('./current-state');
const { unknownFinding } = require('./evidence');
const {
  createDefaultFraudIntelligenceProvider,
  EntityResolutionEngine,
  propagateNetworkRisk
} = require('./fraud-intelligence');

async function analyzeAddressSecurity({ provider, address, chain = 'ethereum', fraudIntelligenceProvider }) {
  if (!provider) throw new Error('A BlockchainProvider is required');
  if (!address) throw new Error('An address is required');
  const classification = await analyzeAddress(provider, address, chain);
  const findings = [...classification.findings, ...(await analyzeHistory(provider, address, chain)), ...(await analyzeApprovals(provider, address, chain))];
  if (classification.addressType === 'SMART_CONTRACT') {
    findings.push(...(await analyzeContract(provider, address, chain)));
    findings.push(...(await analyzeUpgradeability(provider, address, chain)));
  }
  // Current state: native balance + EIP-7702 delegation (OBSERVED/UNKNOWN).
  findings.push(...(await analyzeCurrentState(provider, address, chain)));
  // Token balances for tokens already seen in history (no approval scan).
  const tokenAddresses = [...new Set(findings
    .filter((f) => f.findingType === 'TOKEN_TRANSFER')
    .map((f) => f.token || (f.evidence && (f.evidence.tokenAddress || f.evidence.token)))
    .filter(Boolean))];
  findings.push(...(await analyzeTokenExposure(provider, address, chain, tokenAddresses)));

  // Evidence-based fraud intelligence & network propagation
  const fraudProvider = fraudIntelligenceProvider || createDefaultFraudIntelligenceProvider();
  try {
    const riskEntities = await fraudProvider.getRiskEntities();
    const resolutionBridges = await fraudProvider.getResolutionBridges();
    const resolutionEngine = new EntityResolutionEngine({ bridges: resolutionBridges });
    const { addressToResolutions, unresolvedRecords } = resolutionEngine.resolve(riskEntities);

    let transactions = [];
    try {
      transactions = await provider.getTransactions(address, chain);
    } catch {
      transactions = [];
    }

    const networkFindings = propagateNetworkRisk({
      address,
      chain,
      transactions,
      addressToResolutions,
      unresolvedRecords
    });
    findings.push(...networkFindings);
  } catch (err) {
    findings.push(unknownFinding({
      findingType: 'FRAUD_INTELLIGENCE',
      entity: address,
      chain,
      limitations: [`Fraud intelligence resolution failed: ${err.message}`]
    }));
  }

  return createEvidenceBundle({ address, chain, addressType: classification.addressType, dataMode: provider.mode || 'UNSPECIFIED', findings });
}

async function analyzeProtocolSecurity({ provider, protocol, chain = 'ethereum' }) {
  if (!provider) throw new Error('A BlockchainProvider is required');
  if (!protocol) throw new Error('A protocol definition is required');
  return createEvidenceBundle({ protocol: { name: protocol.name, chain, contracts: protocol.contracts || [] }, dataMode: provider.mode || 'UNSPECIFIED', findings: await analyzeProtocol(provider, protocol, chain) });
}

module.exports = { analyzeAddressSecurity, analyzeProtocolSecurity };
