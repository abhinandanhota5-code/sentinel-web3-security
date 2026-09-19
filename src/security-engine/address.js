const { finding, unknownFinding } = require('./evidence');

async function analyzeAddress(provider, address, chain) {
  try {
    const addressType = await provider.getAddressType(address, chain);
    if (addressType === 'EOA' || addressType === 'SMART_CONTRACT') {
      return { addressType, findings: [finding({ findingType: 'ADDRESS_CLASSIFICATION', status: 'OBSERVED', severity: 'INFO', entity: address, chain, evidence: { contractAddress: address }, explanationInputs: { addressType }, limitations: [] })] };
    }
  } catch (error) {
    return { addressType: 'UNKNOWN', findings: [unknownFinding({ findingType: 'ADDRESS_CLASSIFICATION', entity: address, chain, limitations: [`Provider address classification failed: ${error.message}`] })] };
  }
  return { addressType: 'UNKNOWN', findings: [unknownFinding({ findingType: 'ADDRESS_CLASSIFICATION', entity: address, chain, limitations: ['The provider could not establish whether this address has contract code.'] })] };
}

module.exports = { analyzeAddress };
