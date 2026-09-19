const { finding, unknownFinding } = require('./evidence');

const MAX_UINT256 = (1n << 256n) - 1n;

function isUnlimited(value) {
  try {
    return BigInt(value) === MAX_UINT256;
  } catch {
    return false;
  }
}

async function analyzeApprovals(provider, address, chain) {
  let approvals;
  try {
    approvals = await provider.getTokenApprovals(address, chain);
  } catch (error) {
    return [unknownFinding({ findingType: 'TOKEN_APPROVALS', entity: address, chain, limitations: [`Provider approval lookup failed: ${error.message}`] })];
  }
  const findings = [];
  for (const approval of approvals.filter((item) => item.active)) {
    const evidence = { tokenAddress: approval.tokenAddress, spenderAddress: approval.spenderAddress, allowance: approval.allowance, transactionHash: approval.approvalTransactionHash, blockNumber: approval.approvalBlockNumber };
    findings.push(finding({ findingType: 'ACTIVE_APPROVAL', status: 'OBSERVED', severity: 'INFO', entity: address, chain, evidence, explanationInputs: { active: true }, limitations: [] }));
    if (isUnlimited(approval.allowance)) {
      findings.push(finding({ findingType: 'UNLIMITED_ALLOWANCE', status: 'OBSERVED', severity: 'HIGH', entity: address, chain, evidence, explanationInputs: { allowance: 'MAX_UINT256' }, limitations: [] }));
    }
    try {
      const balance = await provider.getTokenBalance(address, approval.tokenAddress, chain);
      const hasBalance = BigInt(balance?.raw || '0') > 0n;
      findings.push(finding({ findingType: hasBalance ? 'CURRENT_TOKEN_EXPOSURE' : 'APPROVAL_WITHOUT_CURRENT_BALANCE', status: 'INFERRED', severity: hasBalance ? 'HIGH' : 'INFO', entity: address, chain, evidence: { ...evidence, tokenBalance: balance?.raw, tokenSymbol: balance?.symbol }, explanationInputs: { activePermission: true, currentBalance: balance?.raw || '0', exposure: hasBalance }, limitations: [] }));
    } catch (error) {
      findings.push(unknownFinding({ findingType: 'CURRENT_TOKEN_EXPOSURE', entity: address, chain, limitations: [`Token balance lookup failed for ${approval.tokenAddress}: ${error.message}`], explanationInputs: { activePermission: true } }));
    }
  }
  return findings;
}

module.exports = { analyzeApprovals, isUnlimited, MAX_UINT256 };
