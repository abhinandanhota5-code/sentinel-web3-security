const { BlockchainProvider } = require('./provider');
const { DemoBlockchainProvider, ADDRESSES } = require('./demo-provider');
const { analyzeAddressSecurity, analyzeProtocolSecurity } = require('./analyze');
const { STATUSES, SEVERITIES } = require('./evidence');

module.exports = {
  BlockchainProvider,
  DemoBlockchainProvider,
  ADDRESSES,
  analyzeAddressSecurity,
  analyzeProtocolSecurity,
  STATUSES,
  SEVERITIES
};
