const { BlockchainProvider } = require('./provider');
const { DemoBlockchainProvider, ADDRESSES } = require('./demo-provider');
const { analyzeAddressSecurity, analyzeProtocolSecurity } = require('./analyze');
const { STATUSES, SEVERITIES } = require('./evidence');
const { BUNDLE_VERSION, createEvidenceBundle } = require('./bundle');
const { EtherscanBlockchainProvider, EtherscanApiError } = require('./etherscan-provider');
const { RpcBlockchainProvider, CompositeBlockchainProvider, safeBigInt } = require('./rpc-provider');
const { createEthereumProvider } = require('./factory');

const fraudIntelligence = require('./fraud-intelligence');

module.exports = {
  BlockchainProvider,
  DemoBlockchainProvider,
  ADDRESSES,
  analyzeAddressSecurity,
  analyzeProtocolSecurity,
  BUNDLE_VERSION,
  createEvidenceBundle,
  EtherscanBlockchainProvider,
  EtherscanApiError,
  RpcBlockchainProvider,
  CompositeBlockchainProvider,
  createEthereumProvider,
  safeBigInt,
  STATUSES,
  SEVERITIES,
  ...fraudIntelligence
};
