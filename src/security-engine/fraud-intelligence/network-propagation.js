/**
 * Evidence-Based Network Propagation Engine.
 *
 * Implements deterministic network propagation of external fraud-intelligence
 * while strictly preserving epistemic boundaries:
 *
 * 1. The transaction between Wallet A and Entity X is OBSERVED (direct on-chain fact).
 * 2. The fraud designation of Entity X is EXTERNAL (asserted by government/registry).
 * 3. The relationship and exposure of Wallet A is INFERRED (derived by rule).
 *
 * INVARIANT:
 * Sentinel NEVER concludes "Wallet A is fraudulent" based on association.
 * Sentinel reports: "Wallet A has an observed transaction relationship with an
 * externally designated suspect entity."
 */

const { finding } = require('../evidence');

/**
 * Analyzes transactions for the subject address against resolved external risk entities.
 *
 * @param {Object} args
 * @param {string} args.address - Subject address being analyzed
 * @param {string} args.chain - Chain identifier (e.g. 'ethereum')
 * @param {Array} args.transactions - Observed transaction history
 * @param {Map<string, Array>} args.addressToResolutions - Map of resolved suspect addresses
 * @param {Array} args.unresolvedRecords - External entities that could not be mapped to EVM
 * @returns {Array} List of findings (EXTERNAL and INFERRED)
 */
function propagateNetworkRisk({ address, chain, transactions = [], addressToResolutions = new Map(), unresolvedRecords = [] }) {
  const findings = [];
  const subjectNorm = address.toLowerCase();

  // 1. Direct Match: Is the subject address itself an externally designated risk entity?
  const directMatches = addressToResolutions.get(subjectNorm) || [];
  for (const resolution of directMatches) {
    const entity = resolution.externalEntity;
    const severity = entity.designation === 'SANCTIONED' ? 'CRITICAL' : 'HIGH';
    findings.push(finding({
      findingType: 'EXTERNAL_INTELLIGENCE_MATCH',
      status: 'EXTERNAL',
      severity,
      entity: address,
      chain,
      evidence: {
        source: entity.source,
        sourceType: entity.sourceType,
        identifier: entity.identifier,
        identifierType: entity.identifierType,
        designation: entity.designation,
        sourceUrl: entity.sourceUrl,
        confidence: entity.confidence,
        provenance: entity.provenance,
        resolutionType: resolution.resolutionType,
        resolutionBasis: resolution.resolutionBasis,
        notes: entity.notes
      },
      explanationInputs: {
        source: entity.source,
        designation: entity.designation,
        provenance: entity.provenance
      },
      limitations: []
    }));
  }

  // 2. Network Relationship Analysis: 1-hop inbound and outbound transactions
  const seenSuspectTxs = new Set();

  for (const tx of transactions) {
    if (!tx.hash || seenSuspectTxs.has(tx.hash)) continue;

    const fromNorm = (tx.from || '').toLowerCase();
    const toNorm = (tx.to || '').toLowerCase();

    // Check Outbound: Subject -> Suspect Entity
    if (fromNorm === subjectNorm && addressToResolutions.has(toNorm)) {
      const resolutions = addressToResolutions.get(toNorm);
      for (const res of resolutions) {
        const suspectEntity = res.externalEntity;
        seenSuspectTxs.add(tx.hash);

        findings.push(finding({
          findingType: 'SUSPECT_TRANSACTION_OUTBOUND',
          status: 'INFERRED',
          severity: 'HIGH',
          entity: address,
          chain,
          evidence: {
            transactionHash: tx.hash,
            blockNumber: tx.blockNumber,
            timestamp: tx.timestamp,
            value: tx.value,
            tokenAddress: tx.tokenAddress || null,
            tokenSymbol: tx.tokenSymbol || null,
            counterpartyAddress: tx.to,
            relationship: 'OUTBOUND_TRANSFER_TO_SUSPECT',
            suspectSource: suspectEntity.source,
            suspectDesignation: suspectEntity.designation,
            suspectIdentifier: suspectEntity.identifier,
            suspectIdentifierType: suspectEntity.identifierType,
            suspectProvenance: suspectEntity.provenance,
            resolutionType: res.resolutionType,
            resolutionBasis: res.resolutionBasis,
            claim: 'Subject wallet has an observed outbound transfer to an externally designated suspect entity. ' +
                   'This establishes observed transaction exposure, but does not certify that the subject wallet is fraudulent.'
          },
          explanationInputs: {
            rule: 'SUSPECT_TRANSACTION_OUTBOUND',
            direction: 'OUTBOUND',
            counterpartyAddress: tx.to,
            suspectSource: suspectEntity.source,
            suspectDesignation: suspectEntity.designation,
            provenance: suspectEntity.provenance
          },
          limitations: []
        }));
      }
    }

    // Check Inbound: Suspect Entity -> Subject
    if (toNorm === subjectNorm && addressToResolutions.has(fromNorm)) {
      const resolutions = addressToResolutions.get(fromNorm);
      for (const res of resolutions) {
        const suspectEntity = res.externalEntity;
        seenSuspectTxs.add(tx.hash);

        findings.push(finding({
          findingType: 'SUSPECT_TRANSACTION_INBOUND',
          status: 'INFERRED',
          severity: 'HIGH',
          entity: address,
          chain,
          evidence: {
            transactionHash: tx.hash,
            blockNumber: tx.blockNumber,
            timestamp: tx.timestamp,
            value: tx.value,
            tokenAddress: tx.tokenAddress || null,
            tokenSymbol: tx.tokenSymbol || null,
            counterpartyAddress: tx.from,
            relationship: 'INBOUND_TRANSFER_FROM_SUSPECT',
            suspectSource: suspectEntity.source,
            suspectDesignation: suspectEntity.designation,
            suspectIdentifier: suspectEntity.identifier,
            suspectIdentifierType: suspectEntity.identifierType,
            suspectProvenance: suspectEntity.provenance,
            resolutionType: res.resolutionType,
            resolutionBasis: res.resolutionBasis,
            claim: 'Subject wallet has an observed inbound transfer from an externally designated suspect entity. ' +
                   'This establishes observed exposure to suspect funds, but does not certify that the subject wallet is fraudulent.'
          },
          explanationInputs: {
            rule: 'SUSPECT_TRANSACTION_INBOUND',
            direction: 'INBOUND',
            counterpartyAddress: tx.from,
            suspectSource: suspectEntity.source,
            suspectDesignation: suspectEntity.designation,
            provenance: suspectEntity.provenance
          },
          limitations: []
        }));
      }
    }
  }

  return findings;
}

module.exports = {
  propagateNetworkRisk
};
