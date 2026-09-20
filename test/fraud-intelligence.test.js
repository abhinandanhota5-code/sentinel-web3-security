const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  createExternalRiskEntity,
  createResolutionRecord,
  EntityResolutionEngine,
  propagateNetworkRisk,
  I4cFraudIntelligenceProvider,
  OfacFraudIntelligenceProvider,
  CompositeFraudIntelligenceProvider,
  analyzeAddressSecurity,
  DemoBlockchainProvider,
  STATUSES
} = require('../src/security-engine');

describe('Fraud Intelligence & Network Propagation', () => {
  describe('Normalized External Risk Entity', () => {
    it('creates a normalized ExternalRiskEntity with valid fields', () => {
      const entity = createExternalRiskEntity({
        source: 'I4C_NCRP',
        sourceType: 'GOVERNMENT',
        identifier: '0x6666666666666666666666666666666666666666',
        identifierType: 'EVM_ADDRESS',
        designation: 'MULE_ACCOUNT',
        sourceUrl: 'https://cybercrime.gov.in/Webform/suspect_search_repository.aspx',
        confidence: 'HIGH',
        provenance: 'CFCFRMS citizen complaint under police investigation.'
      });

      assert.equal(entity.source, 'I4C_NCRP');
      assert.equal(entity.sourceType, 'GOVERNMENT');
      assert.equal(entity.identifier, '0x6666666666666666666666666666666666666666');
      assert.equal(entity.designation, 'MULE_ACCOUNT');
      assert.equal(entity.confidence, 'HIGH');
      assert.ok(entity.provenance.includes('CFCFRMS'));
    });

    it('rejects an entity with invalid source type or missing provenance', () => {
      assert.throws(() => {
        createExternalRiskEntity({
          source: 'TEST',
          sourceType: 'INVALID_SOURCE_TYPE',
          identifier: '0x1234',
          identifierType: 'EVM_ADDRESS',
          designation: 'SUSPECT',
          provenance: 'Test provenance'
        });
      }, /Invalid sourceType/);

      assert.throws(() => {
        createExternalRiskEntity({
          source: 'TEST',
          sourceType: 'GOVERNMENT',
          identifier: '0x1234',
          identifierType: 'EVM_ADDRESS',
          designation: 'SUSPECT'
        });
      }, /provenance is required/);
    });

    it('verifies that STATUSES includes EXTERNAL', () => {
      assert.ok(STATUSES.includes('EXTERNAL'), 'STATUSES must include EXTERNAL');
    });
  });

  describe('Entity Resolution Layer', () => {
    const engine = new EntityResolutionEngine({
      bridges: [
        {
          identifier: 'mule@okhdfcbank',
          resolvedAddress: '0x3333333333333333333333333333333333333333',
          resolutionType: 'ATTRIBUTED_P2P_ONRAMP',
          resolutionConfidence: 'HIGH',
          resolutionBasis: 'Attributed via P2P merchant order history.'
        }
      ]
    });

    it('resolves direct EVM address as DIRECT_EVM', () => {
      const entity = createExternalRiskEntity({
        source: 'OFAC_SDN',
        sourceType: 'GOVERNMENT',
        identifier: '0x098ea70c9afb49bb79d8208aa45a46acb0c59293',
        identifierType: 'EVM_ADDRESS',
        designation: 'SANCTIONED',
        confidence: 'VERIFIED_LEGAL',
        provenance: 'OFAC SDN Executive Order designation.'
      });

      const result = engine.resolve([entity]);
      assert.equal(result.unresolvedRecords.length, 0);
      assert.ok(result.addressToResolutions.has('0x098ea70c9afb49bb79d8208aa45a46acb0c59293'));

      const res = result.addressToResolutions.get('0x098ea70c9afb49bb79d8208aa45a46acb0c59293')[0];
      assert.equal(res.resolutionType, 'DIRECT_EVM');
      assert.equal(res.resolvedAddress, '0x098ea70c9afb49bb79d8208aa45a46acb0c59293');
    });

    it('resolves off-chain UPI with verified bridge as ATTRIBUTED_P2P_ONRAMP', () => {
      const entity = createExternalRiskEntity({
        source: 'I4C_NCRP',
        sourceType: 'GOVERNMENT',
        identifier: 'mule@okhdfcbank',
        identifierType: 'UPI_ID',
        designation: 'MULE_ACCOUNT',
        confidence: 'HIGH',
        provenance: 'CFCFRMS complaint.'
      });

      const result = engine.resolve([entity]);
      assert.equal(result.unresolvedRecords.length, 0);
      assert.ok(result.addressToResolutions.has('0x3333333333333333333333333333333333333333'));

      const res = result.addressToResolutions.get('0x3333333333333333333333333333333333333333')[0];
      assert.equal(res.resolutionType, 'ATTRIBUTED_P2P_ONRAMP');
      assert.equal(res.resolvedAddress, '0x3333333333333333333333333333333333333333');
    });

    it('strictly preserves off-chain identifier WITHOUT bridge as UNRESOLVED and does NOT map to EVM', () => {
      const entity = createExternalRiskEntity({
        source: 'I4C_NCRP',
        sourceType: 'GOVERNMENT',
        identifier: '+919999888877',
        identifierType: 'PHONE_NUMBER',
        designation: 'FRAUD_REPORTED',
        confidence: 'MEDIUM',
        provenance: 'Reported calling number in impersonation scam.'
      });

      const result = engine.resolve([entity]);
      assert.equal(result.unresolvedRecords.length, 1);
      assert.equal(result.unresolvedRecords[0].resolutionType, 'UNRESOLVED');
      assert.equal(result.unresolvedRecords[0].resolvedAddress, null);
      assert.equal(result.addressToResolutions.size, 0, 'Must NOT fabricate an on-chain EVM address');
    });
  });

  describe('Evidence-Based Network Propagation', () => {
    const suspectAddress = '0x6666666666666666666666666666666666666666';
    const subjectAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const cleanCounterparty = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

    const suspectEntity = createExternalRiskEntity({
      source: 'I4C_NCRP',
      sourceType: 'GOVERNMENT',
      identifier: suspectAddress,
      identifierType: 'EVM_ADDRESS',
      designation: 'MULE_ACCOUNT',
      confidence: 'HIGH',
      provenance: 'CFCFRMS reported mule account under 1930 Helpline investigation.'
    });

    const engine = new EntityResolutionEngine();
    const { addressToResolutions } = engine.resolve([suspectEntity]);

    it('infers outbound transaction exposure without asserting subject is fraudulent', () => {
      const transactions = [
        {
          hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
          blockNumber: 1000,
          timestamp: '2026-03-01T12:00:00Z',
          from: subjectAddress,
          to: suspectAddress,
          value: '1000000000000000000'
        },
        {
          hash: '0x2222222222222222222222222222222222222222222222222222222222222222',
          blockNumber: 1001,
          timestamp: '2026-03-01T13:00:00Z',
          from: subjectAddress,
          to: cleanCounterparty,
          value: '500000000000000000'
        }
      ];

      const findings = propagateNetworkRisk({
        address: subjectAddress,
        chain: 'ethereum',
        transactions,
        addressToResolutions
      });

      assert.equal(findings.length, 1);
      const f = findings[0];
      assert.equal(f.findingType, 'SUSPECT_TRANSACTION_OUTBOUND');
      assert.equal(f.status, 'INFERRED');
      assert.equal(f.severity, 'HIGH');
      assert.equal(f.evidence.counterpartyAddress, suspectAddress);
      assert.equal(f.evidence.suspectSource, 'I4C_NCRP');
      assert.equal(f.evidence.suspectDesignation, 'MULE_ACCOUNT');
      assert.ok(f.evidence.claim.includes('does not certify that the subject wallet is fraudulent'));
    });

    it('infers inbound transaction exposure from suspect entity', () => {
      const transactions = [
        {
          hash: '0x3333333333333333333333333333333333333333333333333333333333333333',
          blockNumber: 1005,
          timestamp: '2026-03-02T10:00:00Z',
          from: suspectAddress,
          to: subjectAddress,
          value: '2000000000000000000'
        }
      ];

      const findings = propagateNetworkRisk({
        address: subjectAddress,
        chain: 'ethereum',
        transactions,
        addressToResolutions
      });

      assert.equal(findings.length, 1);
      const f = findings[0];
      assert.equal(f.findingType, 'SUSPECT_TRANSACTION_INBOUND');
      assert.equal(f.status, 'INFERRED');
      assert.equal(f.severity, 'HIGH');
      assert.equal(f.evidence.counterpartyAddress, suspectAddress);
      assert.ok(f.evidence.claim.includes('observed exposure to suspect funds'));
    });

    it('produces EXTERNAL finding when subject address is directly listed', () => {
      const findings = propagateNetworkRisk({
        address: suspectAddress,
        chain: 'ethereum',
        transactions: [],
        addressToResolutions
      });

      assert.equal(findings.length, 1);
      const f = findings[0];
      assert.equal(f.findingType, 'EXTERNAL_INTELLIGENCE_MATCH');
      assert.equal(f.status, 'EXTERNAL');
      assert.equal(f.evidence.source, 'I4C_NCRP');
      assert.equal(f.evidence.designation, 'MULE_ACCOUNT');
      assert.ok(f.evidence.provenance.includes('CFCFRMS'));
    });
  });

  describe('Integration with analyzeAddressSecurity', () => {
    it('integrates fraud intelligence and network propagation into evidence bundle', async () => {
      const suspectAddr = '0x6666666666666666666666666666666666666666';
      const subjectAddr = '0x1111111111111111111111111111111111111111';

      const mockProvider = {
        mode: 'DEMO',
        getCode: async () => '0x',
        getBalance: async () => '1000000000000000000',
        getStorageAt: async () => '0x0',
        getTransactions: async () => [
          {
            hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            blockNumber: 500,
            timestamp: '2026-03-01T00:00:00Z',
            from: subjectAddr,
            to: suspectAddr,
            value: '500000000000000000',
            kind: 'TRANSFER'
          }
        ],
        getApprovals: async () => []
      };

      const bundle = await analyzeAddressSecurity({
        provider: mockProvider,
        address: subjectAddr,
        chain: 'ethereum'
      });

      assert.ok(bundle.evidence.length > 0);
      const suspectFinding = bundle.evidence.find((e) => e.findingType === 'SUSPECT_TRANSACTION_OUTBOUND');
      assert.ok(suspectFinding, 'Evidence bundle must contain SUSPECT_TRANSACTION_OUTBOUND finding');
      assert.equal(suspectFinding.knowledgeType, 'INFERRED');
      assert.equal(suspectFinding.severity, 'HIGH');
      assert.equal(suspectFinding.evidence.suspectSource, 'I4C_NCRP');
    });
  });
});
