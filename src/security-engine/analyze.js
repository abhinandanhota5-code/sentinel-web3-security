    1	const { analyzeAddress } = require('./address');
    2	const { analyzeHistory } = require('./history');
    3	const { analyzeApprovals } = require('./approvals');
    4	const { analyzeContract, analyzeUpgradeability } = require('./contracts');
    5	const { analyzeProtocol } = require('./protocol');
    6	const { createEvidenceBundle } = require('./bundle');
    7	const { analyzeCurrentState, analyzeTokenExposure } = require('./current-state');
    8	
    9	// --- NEW IMPORTS FOR ADDRESS METADATA AND FUNDING ---
   10	const { analyzeAddressMetadata } = require('./metadata'); // Fetches labels, reputation from Etherscan
   11	const { analyzeFundingRelationships } = require('./funding'); // Analyzes transaction history and labels for funding
   12	
   13	async function analyzeAddressSecurity({ provider, address, chain = 'ethereum' }) {
   14	  if (!provider) throw new Error('A BlockchainProvider is required');
   15	  if (!address) throw new Error('An address is required');
   16	
   17	  const classification = await analyzeAddress(provider, address, chain);
   18	  const findings = [...classification.findings];
   19	
   20	  // --- ENHANCED DATA COLLECTION ---
   21	  // 1. Fetch address metadata (labels, reputation, warnings) from Etherscan
   22	  const metadataFindings = await analyzeAddressMetadata(provider, address, chain).catch((e) => {
   23	    console.warn(`Error analyzing address metadata for ${address} on ${chain}: ${e.message}`);
   24	    return []; // Return empty findings array on error
   25	  });
   26	  findings.push(...metadataFindings);
   27	
   28	  // 2. Analyze funding relationships
   29	  // This analysis will likely use transaction history and address labels
   30	  const fundingFindings = await analyzeFundingRelationships(provider, address, chain).catch((e) => {
   31	    console.warn(`Error analyzing funding relationships for ${address} on ${chain}: ${e.message}`);
   32	    return [];
   33	  });
   34	  findings.push(...fundingFindings);
   35	
   36	  // Existing analyses:
   37	  findings.push(...(await analyzeHistory(provider, address, chain)));
   38	  findings.push(...(await analyzeApprovals(provider, address, chain)));
   39	
   40	  if (classification.addressType === 'SMART_CONTRACT') {
   41	    findings.push(...(await analyzeContract(provider, address, chain)));
   42	    findings.push(...(await analyzeUpgradeability(provider, address, chain)));
   43	  }
   44	
   45	  // Current state: native balance + EIP-7702 delegation (OBSERVED/UNKNOWN).
   46	  findings.push(...(await analyzeCurrentState(provider, address, chain)));
   47	
   48	  // Token balances for tokens already seen in history (no approval scan).
   49	  const tokenAddresses = [...new Set(findings
   50	    .filter((f) => f.findingType === 'TOKEN_TRANSFER')
   51	    .map((f) => f.token || (f.evidence && (f.evidence.tokenAddress || f.evidence.token)))
   52	    .filter(Boolean))];
   53	  findings.push(...(await analyzeTokenExposure(provider, address, chain, tokenAddresses)));
   54	
   55	  return createEvidenceBundle({ address, chain, addressType: classification.addressType, dataMode: provider.mode || 'UNSPECIFIED', findings });
   56	}
   57	
   58	async function analyzeProtocolSecurity({ provider, protocol, chain = 'ethereum' }) {
   59	  if (!provider) throw new Error('A BlockchainProvider is required');
   60	  if (!protocol) throw new Error('A protocol definition is required');
   61	  return createEvidenceBundle({ protocol: { name: protocol.name, chain, contracts: protocol.contracts || [] }, dataMode: provider.mode || 'UNSPECIFIED', findings: await analyzeProtocol(provider, protocol, chain) });
   62	}
   63	
   64	module.exports = { analyzeAddressSecurity, analyzeProtocolSecurity };