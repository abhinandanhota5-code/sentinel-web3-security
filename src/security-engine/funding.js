    1	/**
    2	 * Analyzes funding relationships for an address by examining transaction history
    3	 * and correlating it with known address labels.
    4	 */
    5	
    6	async function analyzeFundingRelationships(provider, address, chain) {
    7	  const findings = [];
    8	  const MAX_TRANSACTIONS_TO_ANALYZE = 50; // Limit analysis to recent/significant transactions
    9	  // Labels that might indicate a funding source or destination, and their default severity
   10	  const KNOWN_LABEL_TYPES = {
   11	    'Exchange': 'info',
   12	    'DeFi Protocol': 'info',
   13	    'Scam': 'high', // Higher severity for scam labels
   14	    'Phishing': 'high',
   15	    'Whale': 'warning', // Whale might indicate large movements
   16	    'Known Entity': 'info',
   17	    'Validator': 'info',
   18	    'Project': 'info',
   19	    'Marketplace': 'info'
   20	  };
   21	
   22	  try {
   23	    // 1. Fetch transaction history
   24	    const transactions = await provider.getTransactions(address, chain);
   25	    if (!transactions || transactions.length === 0) {
   26	      console.warn(`No transaction history found for ${address} on ${chain}`);
   27	      // Optionally add an UNKNOWN finding if transaction history is crucial and unavailable
   28	      // findings.push({ id: `FINDING-TX-HISTORY-UNKNOWN-${address}`, kind: 'engine_finding', findingType: 'TRANSACTION_HISTORY_UNAVAILABLE', knowledgeType: 'UNKNOWN', entity: address, chain: chain, evidence: { reason: 'Provider did not return transaction history' }});
   29	      return findings; // Return empty if no history
   30	    }
   31	
   32	    // Limit analysis to a reasonable number of recent/significant transactions
   33	    const recentTransactions = transactions.slice(-MAX_TRANSACTIONS_TO_ANALYZE);
   34	
   35	    // Collect unique addresses involved in transactions (excluding the subject address itself)
   36	    const involvedAddresses = new Set();
   37	    recentTransactions.forEach(tx => {
   38	      // Add sender if it's not the subject address
   39	      if (tx.from && tx.from.toLowerCase() !== address.toLowerCase()) involvedAddresses.add(tx.from);
   40	      // Add receiver if it's not the subject address
   41	      if (tx.to && tx.to.toLowerCase() !== address.toLowerCase()) involvedAddresses.add(tx.to);
   42	      // Include token addresses if they are part of the transaction context (e.g., for token transfers)
   43	      if (tx.tokenAddress) involvedAddresses.add(tx.tokenAddress);
   44	    });
   45	
   46	    // 2. Fetch address metadata (labels) for involved addresses
   47	    const addressMetadataCache = {};
   48	    const metadataPromises = Array.from(involvedAddresses).map(async (addr) => {
   49	      const meta = await provider.getAddressMetadata(addr, chain).catch(e => {
   50	        console.warn(`Failed to fetch metadata for ${addr} on ${chain}: ${e.message}`);
   51	        return null;
   52	      });
   53	      if (meta) {
   54	        addressMetadataCache[addr.toLowerCase()] = meta;
   55	      }
   56	    });
   57	    await Promise.all(metadataPromises);
   58	
   59	    // 3. Correlate transactions with labels to identify funding relationships
   60	    recentTransactions.forEach(tx => {
   61	      let relatedAddress = null;
   62	      let relationshipType = null;
   63	      let amount = tx.value; // Default to native value
   64	      let tokenAddress = tx.tokenAddress; // From token transfer txs
   65	      let tokenSymbol = tx.tokenSymbol;
   66	
   67	      // Determine related address and relationship type
   68	      if (tx.from?.toLowerCase() === address.toLowerCase() && tx.to) {
   69	        relatedAddress = tx.to.toLowerCase();
   70	        relationshipType = 'sent_funds_to';
   71	        // If it's a token transfer, use token value and address
   72	        if (tx.kind === 'TOKEN_TRANSFER') {
   73	            amount = tx.value; // Ensure value is correctly interpreted for tokens
   74	        }
   75	      } else if (tx.to?.toLowerCase() === address.toLowerCase() && tx.from) {
   76	        relatedAddress = tx.from.toLowerCase();
   77	        relationshipType = 'received_funds_from';
   78	        // If it's a token transfer, use token value and address
   79	        if (tx.kind === 'TOKEN_TRANSFER') {
   80	            amount = tx.value; // Ensure value is correctly interpreted for tokens
   81	        }
   82	      }
   83	
   84	      if (relatedAddress) {
   85	        const meta = addressMetadataCache[relatedAddress];
   86	        if (meta && meta.labels && Array.isArray(meta.labels)) {
   87	          const relevantLabels = meta.labels.filter(label => label in KNOWN_LABEL_TYPES);
   88	
   89	          if (relevantLabels.length > 0) {
   90	            const label = relevantLabels.join(', '); // Combine multiple labels if present
   91	            const severity = relevantLabels.some(l => KNOWN_LABEL_TYPES[l] === 'high') ? 'high' :
   92	                             relevantLabels.some(l => KNOWN_LABEL_TYPES[l] === 'warning') ? 'warning' : 'info';
   93	
   94	            // Generate a deterministic ID based on transaction hash and related address
   95	            // Ensure relatedAddress is always present and consistent
   96	            const findingId = `FUNDING-${Buffer.from(tx.hash + relatedAddress).toString('hex').substring(0, 20)}`;
   97	
   98	            findings.push({
   99	              id: findingId,
  100	              kind: 'engine_finding',
  101	              findingType: 'FUNDING_RELATIONSHIP',
  102	              knowledgeType: 'OBSERVED', // Assuming direct flow is observed fact
  103	              severity: severity,
  104	              entity: address, // The subject address
  105	              chain: chain,
  106	              evidence: {
  107	                source: 'security-engine', // Indicates this finding is derived by the engine
  108	                relationship: relationshipType,
  109	                relatedAddress: relatedAddress,
  110	                relatedLabel: label,
  111	                transactionHash: tx.hash,
  112	                amount: amount, // Native or token value
  113	                tokenAddress: tokenAddress || null,
  114	                tokenSymbol: tokenSymbol || null,
  115	                timestamp: tx.timestamp,
  116	                // Heuristic: directLink might indicate if it's a primary transfer vs internal call detail
  117	                directLink: tx.kind === 'TRANSFER' || tx.kind === 'TOKEN_TRANSFER',
  118	                metadataSource: 'Etherscan', // Indicate where the label came from
  119	                metadataUrl: meta?.url || `https://etherscan.io/address/${relatedAddress}` // Use nullish coalescing for safety
  120	              }
  121	            });
  122	          }
  123	        }
  124	      }
  125	    });
  126	
  127	  } catch (e) {
  128	    console.error(`Error analyzing funding relationships for ${address} on ${chain}: ${e.message}`);
  129	    // Add an UNKNOWN finding if analysis fails critically
  130	    findings.push({
  131	      id: `FINDING-FUNDING-UNKNOWN-${address}-${Date.now()}`, // Non-deterministic ID for error state
  132	      kind: 'engine_finding',
  133	      findingType: 'FUNDING_RELATIONSHIP_UNAVAILABLE',
  134	      knowledgeType: 'UNKNOWN',
  135	      entity: address,
  136	      chain: chain,
  137	      evidence: { reason: e.message }
  138	    });
  139	  }
  140	
  141	  return findings;
  142	}
  143	
  144	module.exports = { analyzeFundingRelationships };