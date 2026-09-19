const test = require('node:test');
const assert = require('node:assert/strict');
const { ADDRESSES, DemoBlockchainProvider, analyzeAddressSecurity, analyzeProtocolSecurity } = require('../src/security-engine');

test('demo address analysis returns evidence-first approval exposure', async () => {
  const result = await analyzeAddressSecurity({ provider: new DemoBlockchainProvider(), address: ADDRESSES.wallet, chain: 'ethereum' });
  assert.equal(result.dataMode, 'DEMO');
  assert.equal(result.addressType, 'EOA');
  assert.ok(result.findings.some((item) => item.findingType === 'TRANSACTION_COUNT' && item.status === 'OBSERVED'));
  const exposure = result.findings.find((item) => item.findingType === 'CURRENT_TOKEN_EXPOSURE');
  assert.equal(exposure.status, 'INFERRED');
  assert.equal(exposure.explanationInputs.activePermission, true);
  assert.equal(exposure.explanationInputs.currentBalance, '1250000000000000000');
});

test('demo contract analysis reports proxy and privileged controls', async () => {
  const result = await analyzeAddressSecurity({ provider: new DemoBlockchainProvider(), address: ADDRESSES.protocol, chain: 'ethereum' });
  assert.equal(result.addressType, 'SMART_CONTRACT');
  assert.ok(result.findings.some((item) => item.findingType === 'PROXY_DETECTED'));
  assert.ok(result.findings.some((item) => item.findingType === 'PRIVILEGED_WITHDRAW'));
  assert.ok(result.findings.some((item) => item.findingType === 'PRIVILEGED_ADMIN'));
});

test('protocol analysis exposes admin concentration and dependencies', async () => {
  const result = await analyzeProtocolSecurity({ provider: new DemoBlockchainProvider(), chain: 'ethereum', protocol: { name: 'Demo Protocol', contracts: [{ address: ADDRESSES.protocol, role: 'core' }] } });
  assert.ok(result.findings.some((item) => item.findingType === 'ADMIN_CONCENTRATION'));
  assert.ok(result.findings.some((item) => item.findingType === 'CONTRACT_DEPENDENCY'));
  assert.ok(result.findings.some((item) => item.findingType === 'ABNORMAL_CHANGE' && item.status === 'OBSERVED'));
});

test('unknown provider results stay unknown instead of becoming safe claims', async () => {
  const provider = new DemoBlockchainProvider();
  provider.getAddressType = async () => 'UNKNOWN';
  const result = await analyzeAddressSecurity({ provider, address: '0x9999999999999999999999999999999999999999' });
  assert.equal(result.addressType, 'UNKNOWN');
  assert.ok(result.findings.some((item) => item.findingType === 'ADDRESS_CLASSIFICATION' && item.status === 'UNKNOWN'));
});
