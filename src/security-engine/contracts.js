const { finding, unknownFinding } = require('./evidence');

const PRIVILEGED_SIGNALS = ['pause', 'mint', 'burn', 'withdraw', 'feeControls', 'upgradeFunctions'];

async function analyzeContract(provider, address, chain) {
  let metadata;
  try {
    metadata = await provider.getContractMetadata(address, chain);
  } catch (error) {
    return [unknownFinding({ findingType: 'CONTRACT_SECURITY_SIGNALS', entity: address, chain, limitations: [`Provider contract metadata failed: ${error.message}`] })];
  }
  if (!metadata) return [unknownFinding({ findingType: 'CONTRACT_SECURITY_SIGNALS', entity: address, chain, limitations: ['Contract metadata was not available.'] })];
  if (!metadata.owner && typeof provider.getOwner === 'function') {
    const owner = await provider.getOwner(address, chain).catch(() => null);
    if (owner?.owner) metadata = { ...metadata, owner: owner.owner, ownerBlockNumber: owner.blockNumber };
  }
  const findings = [];
  for (const signal of PRIVILEGED_SIGNALS) {
    const value = metadata[signal];
    const enabled = Array.isArray(value) ? value.length > 0 : value === true;
    if (enabled) findings.push(finding({ findingType: `PRIVILEGED_${signal.toUpperCase()}`, status: 'OBSERVED', severity: signal === 'upgradeFunctions' ? 'HIGH' : 'MEDIUM', entity: address, chain, evidence: { contractAddress: address }, explanationInputs: { signal, value }, limitations: [] }));
  }
  if (metadata.owner || metadata.admin) {
    findings.push(finding({ findingType: 'PRIVILEGED_ADMIN', status: 'OBSERVED', severity: 'HIGH', entity: address, chain, evidence: { contractAddress: address, ownerAddress: metadata.owner, adminAddress: metadata.admin }, explanationInputs: { owner: metadata.owner, admin: metadata.admin }, limitations: [] }));
  }
  if (metadata.timelock === false) {
    findings.push(finding({ findingType: 'TIMELOCK_ABSENT', status: 'OBSERVED', severity: 'MEDIUM', entity: address, chain, evidence: { contractAddress: address }, explanationInputs: { timelock: false }, limitations: [] }));
  }
  if (metadata.dependencies?.length) {
    findings.push(finding({ findingType: 'CONTRACT_DEPENDENCY', status: 'OBSERVED', severity: 'INFO', entity: address, chain, evidence: { contractAddress: address, dependencyAddresses: metadata.dependencies }, explanationInputs: { dependencyCount: metadata.dependencies.length }, limitations: [] }));
  }
  return findings;
}

async function analyzeUpgradeability(provider, address, chain) {
  try {
    const proxy = await provider.getProxyImplementation(address, chain);
    if (!proxy) return [unknownFinding({ findingType: 'UPGRADEABILITY', entity: address, chain, limitations: ['Proxy storage slots or upgrade metadata were not available; absence of a detected pattern is not a safety claim.'] })];
    return [finding({ findingType: 'PROXY_DETECTED', status: 'OBSERVED', severity: 'HIGH', entity: address, chain, evidence: { contractAddress: address, implementationAddress: proxy.implementationAddress, adminAddress: proxy.adminAddress, slot: proxy.slot }, explanationInputs: { proxyDetected: true }, limitations: [] })];
  } catch (error) {
    return [unknownFinding({ findingType: 'UPGRADEABILITY', entity: address, chain, limitations: [`Provider proxy lookup failed: ${error.message}`] })];
  }
}

module.exports = { analyzeContract, analyzeUpgradeability };
