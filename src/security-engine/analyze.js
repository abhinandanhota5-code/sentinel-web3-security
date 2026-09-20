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

const HEX_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

async function analyzeAddressSecurity({ provider, address, chain = 'ethereum', fraudIntelligenceProvider }) {
  if (!provider) throw new Error('A BlockchainProvider is required');
  if (!address) throw new Error('An address is required');

  const rawAddress = typeof address === 'string' ? address.trim() : String(address).trim();
  if (!HEX_ADDRESS_REGEX.test(rawAddress)) {
    return createEvidenceBundle({
      address: rawAddress || String(address),
      chain,
      addressType: 'UNKNOWN',
      dataMode: provider.mode || 'UNSPECIFIED',
      findings: [
        unknownFinding({
          findingType: 'ADDRESS_CLASSIFICATION',
          entity: rawAddress || String(address),
          chain,
          limitations: [`Invalid EVM address format: "${address}". Expected 20-byte hex address starting with 0x.`]
        })
      ]
    });
  }

  const targetAddress = `0x${rawAddress.slice(2).toLowerCase()}`;
  const classification = await analyzeAddress(provider, targetAddress, chain);
  const findings = [...classification.findings, ...(await analyzeHistory(provider, targetAddress, chain)), ...(await analyzeApprovals(provider, targetAddress, chain))];
  if (classification.addressType === 'SMART_CONTRACT') {
    findings.push(...(await analyzeContract(provider, targetAddress, chain)));
    findings.push(...(await analyzeUpgradeability(provider, targetAddress, chain)));
  }
  // Current state: native balance + EIP-7702 delegation (OBSERVED/UNKNOWN).
  findings.push(...(await analyzeCurrentState(provider, targetAddress, chain)));
  // Token balances for tokens already seen in history (no approval scan).
  const tokenAddresses = [...new Set(findings
    .filter((f) => f.findingType === 'TOKEN_TRANSFER')
    .map((f) => f.token || (f.evidence && (f.evidence.tokenAddress || f.evidence.token)))
    .filter(Boolean))];
  findings.push(...(await analyzeTokenExposure(provider, targetAddress, chain, tokenAddresses)));

  // Evidence-based fraud intelligence & network propagation
  const fraudProvider = fraudIntelligenceProvider || createDefaultFraudIntelligenceProvider();
  try {
    const riskEntities = await fraudProvider.getRiskEntities();
    const resolutionBridges = await fraudProvider.getResolutionBridges();
    const resolutionEngine = new EntityResolutionEngine({ bridges: resolutionBridges });
    const { addressToResolutions, unresolvedRecords } = resolutionEngine.resolve(riskEntities);

    let transactions = [];
    try {
      transactions = await provider.getTransactions(targetAddress, chain);
    } catch {
      transactions = [];
    }

    const networkFindings = propagateNetworkRisk({
      address: targetAddress,
      chain,
      transactions,
      addressToResolutions,
      unresolvedRecords
    });
    findings.push(...networkFindings);
  } catch (err) {
    findings.push(unknownFinding({
      findingType: 'FRAUD_INTELLIGENCE',
      entity: targetAddress,
      chain,
      limitations: [`Fraud intelligence resolution failed: ${err.message}`]
    }));
  }

  return createEvidenceBundle({ address: targetAddress, chain, addressType: classification.addressType, dataMode: provider.mode || 'UNSPECIFIED', findings });
}

async function analyzeProtocolSecurity({ provider, protocol, chain = 'ethereum' }) {
  if (!provider) throw new Error('A BlockchainProvider is required');
  if (!protocol) throw new Error('A protocol definition is required');
  return createEvidenceBundle({ protocol: { name: protocol.name, chain, contracts: protocol.contracts || [] }, dataMode: provider.mode || 'UNSPECIFIED', findings: await analyzeProtocol(provider, protocol, chain) });
}

module.exports = { analyzeAddressSecurity, analyzeProtocolSecurity };
