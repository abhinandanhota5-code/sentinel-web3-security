/**
 * Normalized External Intelligence Model & Entity Resolution Types.
 *
 * Epistemic discipline:
 * - External intelligence records represent claims from third-party or government
 *   sources. They carry provenance and legal/complaint disclaimers and are
 *   classified as EXTERNAL in Sentinel's epistemic model.
 * - Non-EVM identifiers (UPI, bank accounts, phones) MUST NOT be assumed to map
 *   directly to EVM addresses unless an attested resolution link is verified.
 */

const INTELLIGENCE_SOURCE_TYPES = Object.freeze([
  'GOVERNMENT',
  'PUBLIC_REGISTRY',
  'BLOCKCHAIN_PROVIDER',
  'OTHER_TRUSTED_SOURCE'
]);

const IDENTIFIER_TYPES = Object.freeze([
  'EVM_ADDRESS',
  'CRYPTO_ADDRESS_OTHER',
  'BANK_ACCOUNT',
  'UPI_ID',
  'PHONE_NUMBER',
  'EMAIL_ADDRESS',
  'URL',
  'DOMAIN',
  'OTHER'
]);

const RISK_DESIGNATIONS = Object.freeze([
  'SUSPECT',
  'FRAUD_REPORTED',
  'SCAM_REPORTED',
  'MULE_ACCOUNT',
  'SANCTIONED',
  'PHISHING',
  'OTHER'
]);

const CONFIDENCE_LEVELS = Object.freeze([
  'LOW',
  'MEDIUM',
  'HIGH',
  'VERIFIED_LEGAL'
]);

const RESOLUTION_TYPES = Object.freeze([
  'DIRECT_EVM',
  'ATTRIBUTED_P2P_ONRAMP',
  'ATTRIBUTED_EXCHANGE_MEMO',
  'DOMAIN_DEPLOYER_LINK',
  'IDENTITY_CLAIM',
  'UNRESOLVED'
]);

/**
 * Creates a normalized ExternalRiskEntity.
 */
function createExternalRiskEntity({
  source,
  sourceType,
  identifier,
  identifierType,
  designation,
  sourceUrl,
  firstSeen,
  lastUpdated = new Date().toISOString(),
  confidence = 'MEDIUM',
  provenance,
  notes
}) {
  if (!source || typeof source !== 'string') throw new Error('source must be a non-empty string');
  if (!INTELLIGENCE_SOURCE_TYPES.includes(sourceType)) {
    throw new Error(`Invalid sourceType: ${sourceType}. Must be one of: ${INTELLIGENCE_SOURCE_TYPES.join(', ')}`);
  }
  if (!identifier || typeof identifier !== 'string') throw new Error('identifier must be a non-empty string');
  if (!IDENTIFIER_TYPES.includes(identifierType)) {
    throw new Error(`Invalid identifierType: ${identifierType}. Must be one of: ${IDENTIFIER_TYPES.join(', ')}`);
  }
  if (!RISK_DESIGNATIONS.includes(designation)) {
    throw new Error(`Invalid designation: ${designation}. Must be one of: ${RISK_DESIGNATIONS.join(', ')}`);
  }
  if (!CONFIDENCE_LEVELS.includes(confidence)) {
    throw new Error(`Invalid confidence: ${confidence}. Must be one of: ${CONFIDENCE_LEVELS.join(', ')}`);
  }
  if (!provenance || typeof provenance !== 'string') {
    throw new Error('provenance is required to establish legal/methodological origin');
  }

  // Canonicalize EVM addresses to lowercase
  const normalizedIdentifier = identifierType === 'EVM_ADDRESS'
    ? identifier.toLowerCase()
    : identifier.trim();

  return {
    source,
    sourceType,
    identifier: normalizedIdentifier,
    identifierType,
    designation,
    sourceUrl,
    firstSeen,
    lastUpdated,
    confidence,
    provenance,
    notes
  };
}

/**
 * Creates an EntityResolutionRecord documenting the mapping between an
 * external identifier and an EVM address.
 */
function createResolutionRecord({
  externalEntity,
  resolvedAddress = null,
  resolutionType,
  resolutionConfidence = 'UNRESOLVED',
  resolutionBasis,
  resolutionEvidenceRef
}) {
  if (!externalEntity) throw new Error('externalEntity is required');
  if (!RESOLUTION_TYPES.includes(resolutionType)) {
    throw new Error(`Invalid resolutionType: ${resolutionType}. Must be one of: ${RESOLUTION_TYPES.join(', ')}`);
  }

  const normalizedAddress = resolvedAddress ? resolvedAddress.toLowerCase() : null;

  return {
    externalEntity,
    resolvedAddress: normalizedAddress,
    resolutionType,
    resolutionConfidence,
    resolutionBasis: resolutionBasis || (resolutionType === 'DIRECT_EVM' ? 'Identifier is an on-chain EVM address' : null),
    resolutionEvidenceRef,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  INTELLIGENCE_SOURCE_TYPES,
  IDENTIFIER_TYPES,
  RISK_DESIGNATIONS,
  CONFIDENCE_LEVELS,
  RESOLUTION_TYPES,
  createExternalRiskEntity,
  createResolutionRecord
};
