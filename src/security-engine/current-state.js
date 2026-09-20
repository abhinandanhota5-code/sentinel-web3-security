const { finding, unknownFinding } = require('./evidence');

/**
 * Current-state analysis: native balance, EIP-7702 delegation, and token
 * balances for tokens already observed in history. Deterministic only —
 * every failed lookup becomes an explicit UNKNOWN with a coverage gap.
 */

async function analyzeCurrentState(provider, address, chain) {
  const findings = [];

  // Native balance (OBSERVED).
  if (typeof provider.getNativeBalance === 'function') {
    try {
      const nativeWei = await provider.getNativeBalance(address, chain);
      findings.push(finding({
        findingType: 'NATIVE_BALANCE',
        status: 'OBSERVED',
        severity: 'INFO',
        entity: address,
        chain,
        evidence: { nativeBalanceWei: String(nativeWei) },
        explanationInputs: { nativeBalanceWei: String(nativeWei) },
        limitations: [],
      }));
    } catch (error) {
      findings.push(unknownFinding({ findingType: 'NATIVE_BALANCE', entity: address, chain, limitations: [`Native balance lookup failed: ${error.message}`] }));
    }
  }

  // EIP-7702 delegation (OBSERVED relationship, never auto-labeled malicious).
  if (typeof provider.getEip7702Delegate === 'function') {
    try {
      const delegate = await provider.getEip7702Delegate(address, chain);
      if (delegate) {
        findings.push(finding({
          findingType: 'EIP7702_DELEGATION',
          status: 'OBSERVED',
          severity: 'INFO',
          entity: address,
          chain,
          evidence: {
            delegatedTo: delegate.delegatedTo,
            delegatedToIsContract: delegate.delegatedToIsContract,
            delegatedToCodeSizeBytes: delegate.delegatedToCodeSizeBytes,
          },
          explanationInputs: {
            delegatedTo: delegate.delegatedTo,
            delegatedToIsContract: delegate.delegatedToIsContract,
            note: 'Observed EIP-7702 delegation relationship; not by itself a verdict on the delegate target.',
          },
          limitations: [],
        }));
      }
    } catch (error) {
      findings.push(unknownFinding({ findingType: 'EIP7702_DELEGATION', entity: address, chain, limitations: [`EIP-7702 delegation lookup failed: ${error.message}`] }));
    }
  }

  return findings;
}

/**
 * Token exposure for token contracts already known from observed history.
 * No approval enumeration here: if that scan is unavailable, allowance state
 * is reported UNKNOWN by the approvals analyzer, not silently dropped.
 */
async function analyzeTokenExposure(provider, address, chain, tokenAddresses) {
  const findings = [];
  for (const tokenAddress of (tokenAddresses || []).slice(0, 25)) {
    try {
      const balance = await provider.getTokenBalance(address, tokenAddress, chain);
      const raw = balance?.raw || '0';
      findings.push(finding({
        findingType: 'CURRENT_TOKEN_EXPOSURE',
        status: 'INFERRED',
        severity: BigInt(raw) > 0n ? 'MEDIUM' : 'INFO',
        entity: address,
        chain,
        evidence: { tokenAddress, tokenBalance: raw, tokenSymbol: balance?.symbol },
        explanationInputs: { currentBalance: raw, tokenAddress, tokenSymbol: balance?.symbol },
        limitations: [],
      }));
    } catch (error) {
      findings.push(unknownFinding({ findingType: 'CURRENT_TOKEN_EXPOSURE', entity: address, chain, limitations: [`Token balance lookup failed for ${tokenAddress}: ${error.message}`], explanationInputs: { tokenAddress } }));
    }
  }
  return findings;
}

module.exports = { analyzeCurrentState, analyzeTokenExposure };
