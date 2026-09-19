const { finding, unknownFinding } = require('./evidence');

async function analyzeProtocol(provider, protocol, chain) {
  const contracts = protocol.contracts || [];
  const findings = [];
  if (!contracts.length) {
    findings.push(unknownFinding({ findingType: 'IMPORTANT_PROTOCOL_CONTRACTS', entity: protocol.name || 'protocol', chain, limitations: ['No core contracts were supplied for protocol analysis.'] }));
    return findings;
  }
  const admins = new Map();
  for (const contract of contracts) {
    const metadata = await provider.getContractMetadata(contract.address, chain).catch(() => null);
    const admin = metadata?.admin || metadata?.owner;
    if (admin) admins.set(admin.toLowerCase(), (admins.get(admin.toLowerCase()) || 0) + 1);
    if (metadata?.dependencies?.length) findings.push(finding({ findingType: 'CONTRACT_DEPENDENCY', status: 'OBSERVED', severity: 'INFO', entity: contract.address, chain, evidence: { contractAddress: contract.address, dependencyAddresses: metadata.dependencies }, explanationInputs: { dependencyCount: metadata.dependencies.length }, limitations: [] }));
    if (metadata?.upgradeFunctions?.length) findings.push(finding({ findingType: 'UPGRADE_AUTHORITY', status: 'OBSERVED', severity: 'HIGH', entity: contract.address, chain, evidence: { contractAddress: contract.address, adminAddress: metadata.admin, ownerAddress: metadata.owner }, explanationInputs: { upgradeFunctions: metadata.upgradeFunctions }, limitations: [] }));
    const logs = await provider.getLogs(contract.address, chain).catch(() => null);
    if (logs === null) {
      findings.push(unknownFinding({ findingType: 'SUSPICIOUS_ACTIVITY', entity: contract.address, chain, limitations: ['Event log coverage was unavailable for this contract.'] }));
    } else {
      const upgrades = logs.filter((log) => log.event === 'UPGRADE');
      if (upgrades.length) {
        findings.push(finding({ findingType: 'ABNORMAL_CHANGE', status: 'OBSERVED', severity: 'HIGH', entity: contract.address, chain, evidence: { contractAddress: contract.address, transactionHash: upgrades[0].transactionHash, blockNumber: upgrades[0].blockNumber }, explanationInputs: { event: 'UPGRADE', eventCount: upgrades.length }, limitations: [] }));
      }
      if (logs.some((log) => log.event === 'SUSPICIOUS')) {
        findings.push(finding({ findingType: 'SUSPICIOUS_ACTIVITY', status: 'OBSERVED', severity: 'HIGH', entity: contract.address, chain, evidence: { contractAddress: contract.address, transactionHash: logs.find((log) => log.event === 'SUSPICIOUS').transactionHash }, explanationInputs: { event: 'SUSPICIOUS' }, limitations: [] }));
      }
    }
  }
  if (admins.size) {
    const [admin, count] = [...admins.entries()].sort((a, b) => b[1] - a[1])[0];
    findings.push(finding({ findingType: 'ADMIN_CONCENTRATION', status: 'INFERRED', severity: count > 1 ? 'HIGH' : 'MEDIUM', entity: protocol.name || 'protocol', chain, evidence: { adminAddress: admin, controlledContractCount: count }, explanationInputs: { distinctAdminCount: admins.size, controlledContractCount: contracts.length }, limitations: [] }));
  } else {
    findings.push(unknownFinding({ findingType: 'ADMIN_CONCENTRATION', entity: protocol.name || 'protocol', chain, limitations: ['Owner/admin data was unavailable for the supplied core contracts.'] }));
  }
  findings.push(finding({ findingType: 'IMPORTANT_PROTOCOL_CONTRACTS', status: 'OBSERVED', severity: 'INFO', entity: protocol.name || 'protocol', chain, evidence: { contractAddresses: contracts.map((contract) => contract.address) }, explanationInputs: { coreContractCount: contracts.length }, limitations: [] }));
  return findings;
}

module.exports = { analyzeProtocol };
