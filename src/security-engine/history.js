const { finding, unknownFinding } = require('./evidence');

async function analyzeHistory(provider, address, chain) {
  try {
    const transactions = await provider.getTransactions(address, chain);
    const findings = [finding({ findingType: 'TRANSACTION_COUNT', status: 'OBSERVED', severity: 'INFO', entity: address, chain, evidence: { transactionCount: transactions.length }, explanationInputs: { transactionCount: transactions.length }, limitations: [] })];
    const ordered = transactions.filter((tx) => tx.timestamp).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    if (ordered.length) {
      findings.push(finding({ findingType: 'FIRST_ACTIVITY', status: 'OBSERVED', severity: 'INFO', entity: address, chain, evidence: { transactionHash: ordered[0].hash, blockNumber: ordered[0].blockNumber, timestamp: ordered[0].timestamp }, limitations: [] }));
      findings.push(finding({ findingType: 'LAST_ACTIVITY', status: 'OBSERVED', severity: 'INFO', entity: address, chain, evidence: { transactionHash: ordered.at(-1).hash, blockNumber: ordered.at(-1).blockNumber, timestamp: ordered.at(-1).timestamp }, limitations: [] }));
    }
    for (const transaction of transactions.filter((tx) => tx.kind === 'CONTRACT_INTERACTION' || tx.kind === 'TOKEN_TRANSFER')) {
      findings.push(finding({ findingType: transaction.kind, status: 'OBSERVED', severity: 'INFO', entity: address, chain, evidence: { transactionHash: transaction.hash, blockNumber: transaction.blockNumber, contractAddress: transaction.to, timestamp: transaction.timestamp }, explanationInputs: { direction: transaction.from?.toLowerCase() === address.toLowerCase() ? 'OUTBOUND' : 'INBOUND' }, limitations: [] }));
      if (transaction.important === true) findings.push(finding({ findingType: 'IMPORTANT_INTERACTION', status: 'OBSERVED', severity: 'INFO', entity: address, chain, evidence: { transactionHash: transaction.hash, blockNumber: transaction.blockNumber, contractAddress: transaction.to, timestamp: transaction.timestamp }, explanationInputs: { sourceKind: transaction.kind }, limitations: [] }));
    }
    return findings;
  } catch (error) {
    return [unknownFinding({ findingType: 'TRANSACTION_HISTORY', entity: address, chain, limitations: [`Provider transaction history failed: ${error.message}`] })];
  }
}

module.exports = { analyzeHistory };
