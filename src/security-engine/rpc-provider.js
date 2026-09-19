const { BlockchainProvider } = require('./provider');

const APPROVAL_TOPIC = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925';
const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
const ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';

function paddedAddress(address) {
  return address.toLowerCase().replace(/^0x/, '').padStart(64, '0');
}

function addressFromWord(word) {
  if (!word || /^0x?0+$/.test(word)) return undefined;
  return `0x${word.replace(/^0x/, '').slice(-40)}`;
}

function quantityToNumber(value) {
  const number = Number.parseInt(value, 16);
  return Number.isFinite(number) ? number : undefined;
}

function decodeString(value) {
  if (!value || value === '0x') return undefined;
  const hex = value.replace(/^0x/, '');
  try {
    const offset = Number.parseInt(hex.slice(0, 64), 16) * 2;
    const length = Number.parseInt(hex.slice(offset, offset + 64), 16) * 2;
    return Buffer.from(hex.slice(offset + 64, offset + 64 + length), 'hex').toString('utf8') || undefined;
  } catch {
    return undefined;
  }
}

class RpcBlockchainProvider extends BlockchainProvider {
  constructor({ rpcUrl, fetchImpl = globalThis.fetch, mode = 'REAL' } = {}) {
    super();
    if (!rpcUrl) throw new Error('ETHEREUM_RPC_URL is required for the RPC provider');
    if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required');
    this.mode = mode;
    this.rpcUrl = rpcUrl;
    this.fetchImpl = fetchImpl;
  }

  async rpc(method, params) {
    let response;
    try {
      response = await this.fetchImpl(this.rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
    } catch (error) {
      throw new Error(`RPC request failed: ${error.message}`);
    }
    if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
    const payload = await response.json();
    if (payload.error) throw new Error(`RPC ${method} failed: ${payload.error.message || payload.error.code}`);
    return payload.result;
  }

  async getAddressType(address) {
    const code = await this.rpc('eth_getCode', [address, 'latest']);
    if (code === '0x') return 'EOA';
    if (code) return 'SMART_CONTRACT';
    return 'UNKNOWN';
  }

  async getTransactions() {
    throw new Error('Transaction history requires the indexed provider');
  }

  async getTokenApprovals(address, chain) {
    const logs = await this.rpc('eth_getLogs', [{ fromBlock: '0x0', toBlock: 'latest', topics: [APPROVAL_TOPIC, `0x${paddedAddress(address)}`] }]);
    const approvals = [];
    for (const log of logs) {
      const spenderAddress = addressFromWord(log.topics?.[2]);
      if (!spenderAddress) continue;
      const allowance = BigInt(log.data || '0x0').toString();
      const current = await this.call(log.address, '0xdd62ed3e', `${paddedAddress(address)}${paddedAddress(spenderAddress)}`).catch(() => undefined);
      approvals.push({ tokenAddress: log.address, spenderAddress, allowance: current ? BigInt(current).toString() : allowance, approvalTransactionHash: log.transactionHash, approvalBlockNumber: quantityToNumber(log.blockNumber), active: current ? BigInt(current) > 0n : allowance !== '0' });
    }
    return approvals;
  }

  async getTokenBalance(address, tokenAddress) {
    const [raw, decimals, symbol] = await Promise.all([
      this.call(tokenAddress, '0x70a08231', paddedAddress(address)),
      this.call(tokenAddress, '0x313ce567', '').catch(() => '0x12'),
      this.call(tokenAddress, '0x95d89b41', '').then(decodeString).catch(() => undefined)
    ]);
    return { raw: BigInt(raw).toString(), decimals: quantityToNumber(decimals) ?? 18, symbol };
  }

  async call(to, selector, data) {
    return this.rpc('eth_call', [{ to, data: `${selector}${data}` }, 'latest']);
  }

  async getContractMetadata(address) {
    const owner = await this.getOwner(address).catch(() => null);
    const proxy = await this.getProxyImplementation(address).catch(() => null);
    if (!owner && !proxy) return null;
    return { contractAddress: address, owner: owner?.owner, admin: proxy?.adminAddress, upgradeFunctions: proxy ? ['upgradeTo'] : [], dependencies: [] };
  }

  async getLogs(address) {
    const logs = await this.rpc('eth_getLogs', [{ address, fromBlock: '0x0', toBlock: 'latest' }]);
    return logs.map((log) => ({ transactionHash: log.transactionHash, blockNumber: quantityToNumber(log.blockNumber), contractAddress: address, event: 'LOG', topics: log.topics, data: log.data }));
  }

  async getOwner(address) {
    const owner = addressFromWord(await this.call(address, '0x8da5cb5b', ''));
    return owner ? { owner } : null;
  }

  async getProxyImplementation(address) {
    const implementationAddress = addressFromWord(await this.rpc('eth_getStorageAt', [address, IMPLEMENTATION_SLOT, 'latest']));
    const adminAddress = addressFromWord(await this.rpc('eth_getStorageAt', [address, ADMIN_SLOT, 'latest']));
    if (!implementationAddress && !adminAddress) return null;
    return { implementationAddress, adminAddress, slot: 'eip1967.proxy.implementation' };
  }
}

class CompositeBlockchainProvider extends BlockchainProvider {
  constructor({ indexer, rpc } = {}) {
    super();
    if (!indexer && !rpc) throw new Error('An indexer or RPC provider is required');
    this.mode = indexer?.mode && rpc?.mode && indexer.mode === rpc.mode ? indexer.mode : 'MIXED';
    this.indexer = indexer;
    this.rpcProvider = rpc;
  }

  async getAddressType(address, chain) { return this.rpcProvider ? this.rpcProvider.getAddressType(address, chain) : this.indexer.getAddressType(address, chain); }
  async getTransactions(address, chain) { return this.indexer.getTransactions(address, chain); }
  async getTokenApprovals(address, chain) { return this.rpcProvider.getTokenApprovals(address, chain); }
  async getTokenBalance(address, tokenAddress, chain) { return this.rpcProvider.getTokenBalance(address, tokenAddress, chain); }
  async getContractMetadata(address, chain) {
    const [indexed, direct] = await Promise.all([this.indexer?.getContractMetadata(address, chain).catch(() => null), this.rpcProvider?.getContractMetadata(address, chain).catch(() => null)]);
    return indexed || direct;
  }
  async getLogs(address, chain) { return this.indexer.getLogs(address, chain); }
  async getOwner(address, chain) { return this.rpcProvider.getOwner(address, chain); }
  async getProxyImplementation(address, chain) { return this.rpcProvider.getProxyImplementation(address, chain); }
}

module.exports = { RpcBlockchainProvider, CompositeBlockchainProvider, APPROVAL_TOPIC, IMPLEMENTATION_SLOT, ADMIN_SLOT };