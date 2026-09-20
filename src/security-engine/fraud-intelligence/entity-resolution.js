/**
 * Entity Resolution Engine.
 *
 * Resolves external risk entities to EVM addresses while strictly respecting
 * the boundary between on-chain addresses and off-chain identifiers.
 *
 * Core Rule:
 * - Off-chain identifiers (bank accounts, UPI IDs, phone numbers, URLs)
 *   MUST NOT be assumed to map to an EVM address without an explicit,
 *   verifiable resolution bridge.
 * - If no bridge exists, the entity is marked UNRESOLVED and never falsely
 *   attributed to an on-chain wallet.
 */

const { createResolutionRecord } = require('./types');

const HEX_40 = /^0x[0-9a-fA-F]{40}$/;

class EntityResolutionEngine {
  constructor(options = {}) {
    this.bridges = options.bridges || [];
  }

  /**
   * Resolves a list of external risk entities into mapped EVM addresses and unmapped items.
   * @param {Array} entities - List of ExternalRiskEntity objects
   * @param {Array} additionalBridges - Optional extra bridge records
   * @returns {Object} { addressToResolutions, unresolvedRecords, allResolutionRecords }
   */
  resolve(entities = [], additionalBridges = []) {
    const allBridges = [...this.bridges, ...additionalBridges];
    const bridgeByIdentifier = new Map();
    for (const b of allBridges) {
      if (b.identifier) {
        bridgeByIdentifier.set(b.identifier.toLowerCase().trim(), b);
      }
    }

    const addressToResolutions = new Map(); // address -> Array<ResolutionRecord>
    const unresolvedRecords = [];
    const allResolutionRecords = [];

    for (const entity of entities) {
      if (entity.identifierType === 'EVM_ADDRESS') {
        // Direct EVM match
        if (HEX_40.test(entity.identifier)) {
          const record = createResolutionRecord({
            externalEntity: entity,
            resolvedAddress: entity.identifier,
            resolutionType: 'DIRECT_EVM',
            resolutionConfidence: entity.confidence === 'VERIFIED_LEGAL' ? 'HIGH' : entity.confidence,
            resolutionBasis: 'Identifier is directly an EVM address reported in external source.',
            resolutionEvidenceRef: entity.sourceUrl || entity.source
          });
          const key = entity.identifier.toLowerCase();
          if (!addressToResolutions.has(key)) addressToResolutions.set(key, []);
          addressToResolutions.get(key).push(record);
          allResolutionRecords.push(record);
        } else {
          // Malformed EVM address - treat as unresolved
          const record = createResolutionRecord({
            externalEntity: entity,
            resolvedAddress: null,
            resolutionType: 'UNRESOLVED',
            resolutionConfidence: 'UNRESOLVED',
            resolutionBasis: 'EVM address identifier is malformed and cannot be resolved on-chain.'
          });
          unresolvedRecords.push(record);
          allResolutionRecords.push(record);
        }
      } else {
        // Off-chain identifier (UPI, Bank Account, Phone, URL, etc.)
        const bridge = bridgeByIdentifier.get(entity.identifier.toLowerCase().trim());
        if (bridge && bridge.resolvedAddress && HEX_40.test(bridge.resolvedAddress)) {
          const record = createResolutionRecord({
            externalEntity: entity,
            resolvedAddress: bridge.resolvedAddress,
            resolutionType: bridge.resolutionType || 'ATTRIBUTED_P2P_ONRAMP',
            resolutionConfidence: bridge.resolutionConfidence || 'MEDIUM',
            resolutionBasis: bridge.resolutionBasis || `Linked to EVM address via verified off-chain bridge (${entity.identifierType}).`,
            resolutionEvidenceRef: bridge.resolutionEvidenceRef || null
          });
          const key = bridge.resolvedAddress.toLowerCase();
          if (!addressToResolutions.has(key)) addressToResolutions.set(key, []);
          addressToResolutions.get(key).push(record);
          allResolutionRecords.push(record);
        } else {
          // No attested resolution link: preserve as UNRESOLVED
          const record = createResolutionRecord({
            externalEntity: entity,
            resolvedAddress: null,
            resolutionType: 'UNRESOLVED',
            resolutionConfidence: 'UNRESOLVED',
            resolutionBasis: `Off-chain identifier (${entity.identifierType}) has no attested mapping to any on-chain EVM address.`
          });
          unresolvedRecords.push(record);
          allResolutionRecords.push(record);
        }
      }
    }

    return {
      addressToResolutions,
      unresolvedRecords,
      allResolutionRecords
    };
  }
}

module.exports = {
  EntityResolutionEngine
};
