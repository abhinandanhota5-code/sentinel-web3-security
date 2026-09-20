/**
 * OFAC SDN Sanctions Documented Dataset.
 *
 * Grounded in official U.S. Department of the Treasury OFAC SDN specifications:
 * - Legal designation under executive order sanctions
 * - High legal certainty (VERIFIED_LEGAL)
 * - Directly specifies digital currency addresses
 */

const { createExternalRiskEntity } = require('./types');

const OFAC_PROVENANCE =
  'U.S. Department of the Treasury, Office of Foreign Assets Control (OFAC), ' +
  'Specially Designated Nationals and Blocked Persons List (SDN). ' +
  'Official government legal sanction designation under Executive Orders.';

const OFAC_ENTITIES = [
  createExternalRiskEntity({
    source: 'OFAC_SDN',
    sourceType: 'GOVERNMENT',
    identifier: '0x098ea70c9afb49bb79d8208aa45a46acb0c59293',
    identifierType: 'EVM_ADDRESS',
    designation: 'SANCTIONED',
    sourceUrl: 'https://sanctionslist.ofac.treas.gov/',
    firstSeen: '2022-04-14T00:00:00Z',
    lastUpdated: '2026-01-10T00:00:00Z',
    confidence: 'VERIFIED_LEGAL',
    provenance: OFAC_PROVENANCE,
    notes: 'Identified as digital currency address linked to the Lazarus Group (DPRK).'
  }),
  createExternalRiskEntity({
    source: 'OFAC_SDN',
    sourceType: 'GOVERNMENT',
    identifier: '0xd90e2f925da726b50c4ed8d0fb909adcc4ecb106',
    identifierType: 'EVM_ADDRESS',
    designation: 'SANCTIONED',
    sourceUrl: 'https://sanctionslist.ofac.treas.gov/',
    firstSeen: '2022-08-08T00:00:00Z',
    lastUpdated: '2025-12-01T00:00:00Z',
    confidence: 'VERIFIED_LEGAL',
    provenance: OFAC_PROVENANCE,
    notes: 'Tornado Cash core router / mixer contract designated under Executive Order 13694.'
  })
];

module.exports = {
  OFAC_PROVENANCE,
  OFAC_ENTITIES
};
