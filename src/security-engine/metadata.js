/**
 * Analyzes Etherscan metadata for an address.
 */

// Assuming path to evidence types for EngineFinding structure if needed directly, but primarily relying on object structure.
// import { EngineFinding } from "../../../@sentinel/ai/dist/evidence"; 

async function analyzeAddressMetadata(provider, address, chain) {
  const findings = [];
  try {
    const metadata = await provider.getAddressMetadata(address, chain);
    if (metadata) {
      // Create findings for labels, reputation, etc.
      // Use a deterministic ID based on address and a hash of key metadata for uniqueness.
      const metadataHash = Buffer.from(JSON.stringify(metadata)).toString('hex').substring(0, 20);

      if (metadata.nametag || metadata.labels || metadata.shortDescription || metadata.notes) {
        findings.push({
          id: `METADATA-LABEL-${address}-${metadataHash}`, // Deterministic ID
          kind: 'engine_finding',
          findingType: 'ETHERSCAN_LABEL',
          knowledgeType: 'OBSERVED',
          severity: 'info', // Default severity, could be adjusted based on label type
          entity: address,
          chain: chain,
          evidence: {
            source: 'Etherscan',
            url: metadata.url || `https://etherscan.io/address/${address}`,
            label: metadata.nametag || metadata.labels?.[0] || metadata.shortDescription || 'Known Address',
            description: metadata.notes || metadata.shortDescription,
            retrievedAt: new Date().toISOString()
          },
        });
      }
      // Add specific findings for exploit warnings or reputation if detected and structured
      // Note: Etherscan's non-PRO API has limitations for detailed exploit warnings.
      if (metadata.reputation && typeof metadata.reputation === 'string' && metadata.reputation.toLowerCase().includes('exploit')) {
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
    }
  } catch (e) {
    console.warn(`Error analyzing address metadata for ${address} on ${chain}: ${e.message}`);
    // Optionally add an UNKNOWN finding if metadata fetching is critical
    findings.push({
      id: `METADATA-UNAVAILABLE-${address}-${Date.now()}`, // Non-deterministic ID for error state
      kind: 'engine_finding',
      findingType: 'METADATA_UNAVAILABLE',
      knowledgeType: 'UNKNOWN',
      entity: address,
      chain: chain,
      evidence: { reason: e.message }
    });
  }
  return findings;
}

module.exports = { analyzeAddressMetadata };