const { BlockchainProvider } = require('./provider');
const { DemoBlockchainProvider, ADDRESSES } = require('./demo-provider');
const { analyzeAddressSecurity, analyzeProtocolSecurity } = require('./analyze');
const { STATUSES, SEVERITIES } = require('./evidence');
const { BUNDLE_VERSION, createEvidenceBundle } = require('./bundle');

module.exports = {
  BlockchainProvider,
  DemoBlockchainProvider,
  ADDRESSES,
  analyzeAddressSecurity,
  analyzeProtocolSecurity,
  BUNDLE_VERSION,
  createEvidenceBundle,
  STATUSES,
  SEVERITIES
};
