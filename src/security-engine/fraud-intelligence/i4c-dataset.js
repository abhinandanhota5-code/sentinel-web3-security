/**
 * I4C / NCRP (CFCFRMS / 1930 Helpline) Documented Development & Fixture Dataset.
 *
 * Grounded in official Indian Cyber Crime Coordination Centre semantics:
 * - Citizen complaint under police inquiry / banking freeze
 * - Carries statutory disclaimers
 * - Includes diverse identifier types: UPI IDs, Bank Accounts, Phone numbers,
 *   and verified P2P/EVM attribution bridges.
 */

const { createExternalRiskEntity } = require('./types');

const I4C_PROVENANCE =
  'Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS / 1930 Helpline), ' +
  'Indian Cyber Crime Coordination Centre (I4C), Ministry of Home Affairs. ' +
  'Citizen complaint registered under police inquiry and inter-bank freeze; ' +
  'does not constitute judicial determination of guilt or certified conviction.';

const I4C_ENTITIES = [
  createExternalRiskEntity({
    source: 'I4C_NCRP',
    sourceType: 'GOVERNMENT',
    identifier: '0x6666666666666666666666666666666666666666',
    identifierType: 'EVM_ADDRESS',
    designation: 'MULE_ACCOUNT',
    sourceUrl: 'https://cybercrime.gov.in/Webform/suspect_search_repository.aspx',
    firstSeen: '2026-01-15T08:30:00Z',
    lastUpdated: '2026-03-10T14:00:00Z',
    confidence: 'HIGH',
    provenance: I4C_PROVENANCE,
    notes: 'Reported in task-force cyber-fraud complaint involving rapid layering of victim deposits.'
  }),
  createExternalRiskEntity({
    source: 'I4C_NCRP',
    sourceType: 'GOVERNMENT',
    identifier: '0x71c85d564998782a210d7a8d5f308a34bc481f9b',
    identifierType: 'EVM_ADDRESS',
    designation: 'SUSPECT',
    sourceUrl: 'https://cybercrime.gov.in/Webform/suspect_search_repository.aspx',
    firstSeen: '2025-11-20T10:15:00Z',
    lastUpdated: '2026-02-01T11:20:00Z',
    confidence: 'HIGH',
    provenance: I4C_PROVENANCE,
    notes: 'Reported crypto destination address in multi-victim investment scam complaints.'
  }),
  createExternalRiskEntity({
    source: 'I4C_NCRP',
    sourceType: 'GOVERNMENT',
    identifier: 'cyberfraudsuspect@okhdfcbank',
    identifierType: 'UPI_ID',
    designation: 'MULE_ACCOUNT',
    sourceUrl: 'https://cybercrime.gov.in/Webform/suspect_search_repository.aspx',
    firstSeen: '2026-02-10T09:00:00Z',
    lastUpdated: '2026-03-01T16:45:00Z',
    confidence: 'HIGH',
    provenance: I4C_PROVENANCE,
    notes: 'Primary beneficiary VPA flagged across multiple 1930 helpline reports.'
  }),
  createExternalRiskEntity({
    source: 'I4C_NCRP',
    sourceType: 'GOVERNMENT',
    identifier: 'SBI-9876543210-SBIN0001234',
    identifierType: 'BANK_ACCOUNT',
    designation: 'MULE_ACCOUNT',
    sourceUrl: 'https://cybercrime.gov.in/Webform/suspect_search_repository.aspx',
    firstSeen: '2026-01-28T12:00:00Z',
    lastUpdated: '2026-02-25T17:00:00Z',
    confidence: 'MEDIUM',
    provenance: I4C_PROVENANCE,
    notes: 'Bank account frozen under CFCFRMS ticket #2026/DEL/89123.'
  }),
  createExternalRiskEntity({
    source: 'I4C_NCRP',
    sourceType: 'GOVERNMENT',
    identifier: '+919876543210',
    identifierType: 'PHONE_NUMBER',
    designation: 'FRAUD_REPORTED',
    sourceUrl: 'https://cybercrime.gov.in/Webform/suspect_search_repository.aspx',
    firstSeen: '2025-12-05T06:20:00Z',
    lastUpdated: '2026-01-18T10:10:00Z',
    confidence: 'MEDIUM',
    provenance: I4C_PROVENANCE,
    notes: 'Calling number used in impersonation scam impersonating law enforcement officers.'
  }),
  createExternalRiskEntity({
    source: 'I4C_NCRP',
    sourceType: 'GOVERNMENT',
    identifier: 'https://phishing-invest-scheme.in/claim',
    identifierType: 'URL',
    designation: 'SCAM_REPORTED',
    sourceUrl: 'https://cybercrime.gov.in/Webform/suspect_search_websites.aspx',
    firstSeen: '2026-03-02T14:30:00Z',
    lastUpdated: '2026-03-12T08:00:00Z',
    confidence: 'HIGH',
    provenance: I4C_PROVENANCE,
    notes: 'Reported fake investment portal hosting malicious wallet-drainer scripts.'
  }),
  // Unresolved entity with NO known EVM mapping to test strict non-EVM boundary
  createExternalRiskEntity({
    source: 'I4C_NCRP',
    sourceType: 'GOVERNMENT',
    identifier: 'unlinkedmule@icici',
    identifierType: 'UPI_ID',
    designation: 'SUSPECT',
    sourceUrl: 'https://cybercrime.gov.in/Webform/suspect_search_repository.aspx',
    firstSeen: '2026-03-05T11:00:00Z',
    lastUpdated: '2026-03-15T12:00:00Z',
    confidence: 'LOW',
    provenance: I4C_PROVENANCE,
    notes: 'Suspect UPI ID with no attributed crypto on-ramp or EVM bridge.'
  })
];

/**
 * Attested Entity Resolution Bridges.
 * Documents how off-chain identifiers link to EVM addresses with verifiable provenance.
 */
const I4C_RESOLUTION_BRIDGES = [
  {
    identifier: 'cyberfraudsuspect@okhdfcbank',
    resolvedAddress: '0x3333333333333333333333333333333333333333',
    resolutionType: 'ATTRIBUTED_P2P_ONRAMP',
    resolutionConfidence: 'HIGH',
    resolutionBasis: 'Linked via verified P2P escrow merchant account settlement on centralized desk.',
    resolutionEvidenceRef: 'P2P-ESCROW-SETTLEMENT-2026-02'
  },
  {
    identifier: 'https://phishing-invest-scheme.in/claim',
    resolvedAddress: '0x4444444444444444444444444444444444444444',
    resolutionType: 'DOMAIN_DEPLOYER_LINK',
    resolutionConfidence: 'HIGH',
    resolutionBasis: 'Frontend dApp embedded recipient address extracted from reported website script.',
    resolutionEvidenceRef: 'URL-EXTRACTED-RECEIVER-BYTECODE'
  }
];

module.exports = {
  I4C_PROVENANCE,
  I4C_ENTITIES,
  I4C_RESOLUTION_BRIDGES
};
