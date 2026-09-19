const test = require('node:test');
const assert = require('node:assert/strict');
const { ADDRESSES, DemoBlockchainProvider, analyzeAddressSecurity, analyzeProtocolSecurity } = require('../src/security-engine');

test('demo address analysis returns evidence-first approval exposure', async () => {
  const result = await analyzeAddressSecurity({ provider: new DemoBlockchainProvider(), address: ADDRESSES.wallet, chain: 'ethereum' });
  assert.equal(result.dataMode, 'DEMO');
  assert.equal(result.addressType, 'EOA');
  assert.equal(result.schemaVersion, '1.0');
  assert.ok(result.evidence.some((item) => item.findingType === 'TRANSACTION_COUNT' && item.knowledgeType === 'OBSERVED'));
  const exposure = result.evidence.find((item) => item.findingType === 'CURRENT_TOKEN_EXPOSURE');
  assert.equal(exposure.knowledgeType, 'INFERRED');
  assert.equal(exposure.explanationInputs.activePermission, true);
  assert.equal(exposure.explanationInputs.currentBalance, '1250000000000000000');
  assert.equal(exposure.token, ADDRESSES.token);
  assert.equal(exposure.spender, ADDRESSES.spender);
});

test('demo contract analysis reports proxy and privileged controls', async () => {
  const result = await analyzeAddressSecurity({ provider: new DemoBlockchainProvider(), address: ADDRESSES.protocol, chain: 'ethereum' });
  assert.equal(result.addressType, 'SMART_CONTRACT');
  assert.ok(result.evidence.some((item) => item.findingType === 'PROXY_DETECTED'));
  assert.ok(result.evidence.some((item) => item.findingType === 'PRIVILEGED_WITHDRAW'));
  const admin = result.evidence.find((item) => item.findingType === 'PRIVILEGED_ADMIN');
  assert.equal(admin.admin, ADDRESSES.admin);
  assert.equal(result.evidence.find((item) => item.findingType === 'PROXY_DETECTED').implementation, ADDRESSES.implementation);
});

test('protocol analysis exposes admin concentration and dependencies', async () => {
  const result = await analyzeProtocolSecurity({ provider: new DemoBlockchainProvider(), chain: 'ethereum', protocol: { name: 'Demo Protocol', contracts: [{ address: ADDRESSES.protocol, role: 'core' }] } });
  assert.ok(result.evidence.some((item) => item.findingType === 'ADMIN_CONCENTRATION'));
  assert.ok(result.evidence.some((item) => item.findingType === 'CONTRACT_DEPENDENCY'));
  assert.ok(result.evidence.some((item) => item.findingType === 'ABNORMAL_CHANGE' && item.knowledgeType === 'OBSERVED'));
});

test('unknown provider results stay unknown instead of becoming safe claims', async () => {
  const provider = new DemoBlockchainProvider();
  provider.getAddressType = async () => 'UNKNOWN';
  const result = await analyzeAddressSecurity({ provider, address: '0x9999999999999999999999999999999999999999' });
  assert.equal(result.addressType, 'UNKNOWN');
  assert.ok(result.evidence.some((item) => item.findingType === 'ADDRESS_CLASSIFICATION' && item.knowledgeType === 'UNKNOWN'));
});

test('EvidenceBundle passes to the Sentinel AI engine without changing citations or knowledge types', async () => {
  const bundle = await analyzeAddressSecurity({ provider: new DemoBlockchainProvider(), address: ADDRESSES.wallet, chain: 'ethereum' });
  let received;
  let llmCalls = 0;
  const sentinelAi = {
    engine: {
      explain: async (evidenceBundle) => {
        received = evidenceBundle;
        return { citations: evidenceBundle.evidence.map((item) => item.id) };
      }
    },
    llm: { complete: async () => { llmCalls += 1; } }
  };

  const explanation = await sentinelAi.engine.explain(bundle);
  assert.strictEqual(received, bundle);
  assert.deepEqual(explanation.citations, bundle.evidence.map((item) => item.id));
  assert.deepEqual(bundle.evidence.find((item) => item.findingType === 'UNLIMITED_ALLOWANCE').sourceReferences, {
    transactionHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    blockNumber: 190,
    tokenAddress: ADDRESSES.token,
    spenderAddress: ADDRESSES.spender,
    allowance: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
  });
  assert.ok(bundle.evidence.some((item) => item.knowledgeType === 'OBSERVED'));
  assert.ok(bundle.evidence.some((item) => item.knowledgeType === 'INFERRED'));
  assert.equal(llmCalls, 0);
  assert.equal(bundle.evidence.find((item) => item.findingType === 'UNLIMITED_ALLOWANCE').transactionHash, '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
});

test('missing blockchain data remains UNKNOWN with explicit coverage gaps', async () => {
  const provider = new DemoBlockchainProvider();
  provider.getTokenBalance = async () => { throw new Error('balance source unavailable'); };
  const bundle = await analyzeAddressSecurity({ provider, address: ADDRESSES.wallet, chain: 'ethereum' });
  const unknown = bundle.evidence.find((item) => item.findingType === 'CURRENT_TOKEN_EXPOSURE');
  assert.equal(unknown.knowledgeType, 'UNKNOWN');
  assert.match(unknown.coverageGaps[0], /balance source unavailable/);
  assert.ok(bundle.coverageGaps.includes(unknown.coverageGaps[0]));
});
