const { DemoBlockchainProvider } = require('./demo-provider');
const { EtherscanBlockchainProvider } = require('./etherscan-provider');
const { RpcBlockchainProvider, CompositeBlockchainProvider } = require('./rpc-provider');

function createEthereumProvider(opts = {}) {
  const apiKey = 'apiKey' in opts ? opts.apiKey : process.env.ETHERSCAN_API_KEY;
  const rpcUrl = 'rpcUrl' in opts ? opts.rpcUrl : process.env.ETHEREUM_RPC_URL;
  const { fetchImpl, ...options } = opts;
  if (!apiKey && !rpcUrl) return new DemoBlockchainProvider();
  const indexer = apiKey ? new EtherscanBlockchainProvider({ apiKey, fetchImpl, ...options }) : undefined;
  const rpc = rpcUrl ? new RpcBlockchainProvider({ rpcUrl, fetchImpl }) : undefined;
  if (indexer && rpc) return new CompositeBlockchainProvider({ indexer, rpc });
  return indexer || rpc;
}

module.exports = { createEthereumProvider };