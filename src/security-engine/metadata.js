    1	/**
    2	 * Analyzes Etherscan metadata for an address.
    3	 */
    4	
    5	// Assuming path to evidence types for EngineFinding structure if needed directly, but primarily relying on object structure.
    6	// import { EngineFinding } from "../../../@sentinel/ai/dist/evidence"; 
    7	
    8	async function analyzeAddressMetadata(provider, address, chain) {
    9	  const findings = [];
   10	  try {
   11	    const metadata = await provider.getAddressMetadata(address, chain);
   12	    if (metadata) {
   13	      // Create findings for labels, reputation, etc.
   14	      // Use a deterministic ID based on address and a hash of key metadata for uniqueness.
   15	      const metadataHash = Buffer.from(JSON.stringify(metadata)).toString('hex').substring(0, 20);
   16	
   17	      if (metadata.nametag || metadata.labels || metadata.shortDescription || metadata.notes) {
   18	        findings.push({
   19	          id: `METADATA-LABEL-${address}-${metadataHash}`, // Deterministic ID
   20	          kind: 'engine_finding',
   21	          findingType: 'ETHERSCAN_LABEL',
   22	          knowledgeType: 'OBSERVED',
   23	          severity: 'info', // Default severity, could be adjusted based on label type
   24	          entity: address,
   25	          chain: chain,
   26	          evidence: {
   27	            source: 'Etherscan',
   28	            url: metadata.url || `https://etherscan.io/address/${address}`,
   29	            label: metadata.nametag || metadata.labels?.[0] || metadata.shortDescription || 'Known Address',
   30	            description: metadata.notes || metadata.shortDescription,
   31	            retrievedAt: new Date().toISOString()
   32	          },
   33	        });
   34	      }
   35	      // Add specific findings for exploit warnings or reputation if detected and structured
   36	      // Note: Etherscan's non-PRO API has limitations for detailed exploit warnings.
   37	      if (metadata.reputation && typeof metadata.reputation === 'string' && metadata.reputation.toLowerCase().includes('exploit')) {
            findings.push({
               id: `METADATA-EXPLOIT-${address}-${metadataHash}`, // Deterministic ID
               kind: 'engine_finding',
               findingType: 'EXPLOIT_WARNING',
               knowledgeType: 'OBSERVED',
               severity: 'high',
               entity: address,
               chain: chain,
               evidence: {
                 source: 'Etherscan',
                 url: metadata.url || `https://etherscan.io/address/${address}`,
                 reputation: metadata.reputation,
                 description: metadata.notes || 'Address flagged with exploit-related reputation.',
                 retrievedAt: new Date().toISOString()
               }
            });
         }
   38	    }
   39	  } catch (e) {
   40	    console.warn(`Error analyzing address metadata for ${address} on ${chain}: ${e.message}`);
   41	    // Optionally add an UNKNOWN finding if metadata fetching is critical
   42	    findings.push({
   43	      id: `METADATA-UNAVAILABLE-${address}-${Date.now()}`, // Non-deterministic ID for error state
   44	      kind: 'engine_finding',
   45	      findingType: 'METADATA_UNAVAILABLE',
   46	      knowledgeType: 'UNKNOWN',
   47	      entity: address,
   48	      chain: chain,
   49	      evidence: { reason: e.message }
   50	    });
   51	  }
   52	  return findings;
   53	}
   54	
   55	module.exports = { analyzeAddressMetadata };