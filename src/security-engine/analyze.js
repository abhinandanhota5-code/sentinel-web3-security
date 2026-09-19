const { analyzeAddress } = require('./address');
const { analyzeHistory } = require('./history');
const { analyzeApprovals } = require('./approvals');
const { analyzeContract, analyzeUpgradeability } = require('./contracts');
const { analyzeProtocol } = require('./protocol');

async function analyzeAddressSecurity({ provider, address, chain = 'ethereum' }) {
  if (!provider) throw new Error('A BlockchainProvider is required');
  if (!address) throw new Error('An address is required');
  const classification = await analyzeAddress(provider, address, chain);
  const findings = [...classification.findings, ...(await analyzeHistory(provider, address, chain)), ...(await analyzeApprovals(provider, address, chain))];
  if (classification.addressType === 'SMART_CONTRACT') {
    findings.push(...(await analyzeContract(provider, address, chain)));
    findings.push(...(await analyzeUpgradeability(provider, address, chain)));
  }
  return { address, chain, addressType: classification.addressType, dataMode: provider.mode || 'UNSPECIFIED', findings };
}

async function analyzeProtocolSecurity({ provider, protocol, chain = 'ethereum' }) {
  if (!provider) throw new Error('A BlockchainProvider is required');
  if (!protocol) throw new Error('A protocol definition is required');
  return { protocol: { name: protocol.name, chain, contracts: protocol.contracts || [] }, dataMode: provider.mode || 'UNSPECIFIED', findings: await analyzeProtocol(provider, protocol, chain) };
}

module.exports = { analyzeAddressSecurity, analyzeProtocolSecurity };
