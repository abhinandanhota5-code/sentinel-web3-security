const { DemoBlockchainProvider } = require('./demo-provider');
const { EtherscanBlockchainProvider } = require('./etherscan-provider');
const { RpcBlockchainProvider, CompositeBlockchainProvider } = require('./rpc-provider');

function createEthereumProvider({ apiKey = process.env.ETHERSCAN_API_KEY, rpcUrl = process.env.ETHEREUM_RPC_URL, fetchImpl, ...options } = {}) {
  if (!apiKey && !rpcUrl) return new DemoBlockchainProvider();
  const indexer = apiKey ? new EtherscanBlockchainProvider({ apiKey, fetchImpl, ...options }) : undefined;
  const rpc = rpcUrl ? new RpcBlockchainProvider({ rpcUrl, fetchImpl }) : undefined;
  if (indexer && rpc) return new CompositeBlockchainProvider({ indexer, rpc });
  return indexer || rpc;
}

module.exports = { createEthereumProvider };