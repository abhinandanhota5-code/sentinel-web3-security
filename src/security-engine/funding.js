/**
 * Analyzes funding relationships for an address by examining transaction history
 * and correlating it with known address labels.
 */

async function analyzeFundingRelationships(provider, address, chain) {
  const findings = [];
  const MAX_TRANSACTIONS_TO_ANALYZE = 50; // Limit analysis to recent/significant transactions
  // Labels that might indicate a funding source or destination, and their default severity
  const KNOWN_LABEL_TYPES = {
    'Exchange': 'info',
    'DeFi Protocol': 'info',
    'Scam': 'high', // Higher severity for scam labels
    'Phishing': 'high',
    'Whale': 'warning', // Whale might indicate large movements
    'Known Entity': 'info',
    'Validator': 'info',
    'Project': 'info',
    'Marketplace': 'info'
  };

  try {
    // 1. Fetch transaction history
    const transactions = await provider.getTransactions(address, chain);
    if (!transactions || transactions.length === 0) {
      console.warn(`No transaction history found for ${address} on ${chain}`);
      // Optionally add an UNKNOWN finding if transaction history is crucial and unavailable
      // findings.push({ id: `FINDING-TX-HISTORY-UNKNOWN-${address}`, kind: 'engine_finding', findingType: 'TRANSACTION_HISTORY_UNAVAILABLE', knowledgeType: 'UNKNOWN', entity: address, chain: chain, evidence: { reason: 'Provider did not return transaction history' }});
      return findings; // Return empty if no history
    }

    // Limit analysis to a reasonable number of recent/significant transactions
    const recentTransactions = transactions.slice(-MAX_TRANSACTIONS_TO_ANALYZE);

    // Collect unique addresses involved in transactions (excluding the subject address itself)
    const involvedAddresses = new Set();
    recentTransactions.forEach(tx => {
      // Add sender if it's not the subject address
      if (tx.from && tx.from.toLowerCase() !== address.toLowerCase()) involvedAddresses.add(tx.from);
      // Add receiver if it's not the subject address
      if (tx.to && tx.to.toLowerCase() !== address.toLowerCase()) involvedAddresses.add(tx.to);
      // Include token addresses if they are part of the transaction context (e.g., for token transfers)
      if (tx.tokenAddress) involvedAddresses.add(tx.tokenAddress);
    });

    // 2. Fetch address metadata (labels) for involved addresses
    const addressMetadataCache = {};
    const metadataPromises = Array.from(involvedAddresses).map(async (addr) => {
      const meta = await provider.getAddressMetadata(addr, chain).catch(e => {
        console.warn(`Failed to fetch metadata for ${addr} on ${chain}: ${e.message}`);
        return null;
      });
      if (meta) {
        addressMetadataCache[addr.toLowerCase()] = meta;
      }
    });
    await Promise.all(metadataPromises);

    // 3. Correlate transactions with labels to identify funding relationships
    recentTransactions.forEach(tx => {
      let relatedAddress = null;
      let relationshipType = null;
      let amount = tx.value; // Default to native value
      let tokenAddress = tx.tokenAddress; // From token transfer txs
      let tokenSymbol = tx.tokenSymbol;

      // Determine related address and relationship type
      if (tx.from?.toLowerCase() === address.toLowerCase() && tx.to) {
        relatedAddress = tx.to.toLowerCase();
        relationshipType = 'sent_funds_to';
        // If it's a token transfer, use token value and address
        if (tx.kind === 'TOKEN_TRANSFER') {
            amount = tx.value; // Ensure value is correctly interpreted for tokens
        }
      } else if (tx.to?.toLowerCase() === address.toLowerCase() && tx.from) {
        relatedAddress = tx.from.toLowerCase();
        relationshipType = 'received_funds_from';
        // If it's a token transfer, use token value and address
        if (tx.kind === 'TOKEN_TRANSFER') {
            amount = tx.value; // Ensure value is correctly interpreted for tokens
        }
      }

      if (relatedAddress) {
        const meta = addressMetadataCache[relatedAddress];
        if (meta && meta.labels && Array.isArray(meta.labels)) {
          const relevantLabels = meta.labels.filter(label => label in KNOWN_LABEL_TYPES);

          if (relevantLabels.length > 0) {
            const label = relevantLabels.join(', '); // Combine multiple labels if present
            const severity = relevantLabels.some(l => KNOWN_LABEL_TYPES[l] === 'high') ? 'high' :
                             relevantLabels.some(l => KNOWN_LABEL_TYPES[l] === 'warning') ? 'warning' : 'info';

            // Generate a deterministic ID based on transaction hash and related address
            // Ensure relatedAddress is always present and consistent
            const findingId = `FUNDING-${Buffer.from(tx.hash + relatedAddress).toString('hex').substring(0, 20)}`;

            findings.push({
              id: findingId,
              kind: 'engine_finding',
              findingType: 'FUNDING_RELATIONSHIP',
              knowledgeType: 'OBSERVED', // Assuming direct flow is observed fact
              severity: severity,
              entity: address, // The subject address
              chain: chain,
              evidence: {
                source: 'security-engine', // Indicates this finding is derived by the engine
                relationship: relationshipType,
                relatedAddress: relatedAddress,
                relatedLabel: label,
                transactionHash: tx.hash,
                amount: amount, // Native or token value
                tokenAddress: tokenAddress || null,
                tokenSymbol: tokenSymbol || null,
                timestamp: tx.timestamp,
                // Heuristic: directLink might indicate if it's a primary transfer vs internal call detail
                directLink: tx.kind === 'TRANSFER' || tx.kind === 'TOKEN_TRANSFER',
                metadataSource: 'Etherscan', // Indicate where the label came from
                metadataUrl: meta?.url || `https://etherscan.io/address/${relatedAddress}` // Use nullish coalescing for safety
              }
            });
          }
        }
      }
    });

  } catch (e) {
    console.error(`Error analyzing funding relationships for ${address} on ${chain}: ${e.message}`);
    // Add an UNKNOWN finding if analysis fails critically
    findings.push({
      id: `FINDING-FUNDING-UNKNOWN-${address}-${Date.now()}`, // Non-deterministic ID for error state
      kind: 'engine_finding',
      findingType: 'FUNDING_RELATIONSHIP_UNAVAILABLE',
      knowledgeType: 'UNKNOWN',
      entity: address,
      chain: chain,
      evidence: { reason: e.message }
    });
  }

  return findings;
}

module.exports = { analyzeFundingRelationships };