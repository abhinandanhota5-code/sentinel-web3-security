const { BlockchainProvider } = require('./provider');

const DEFAULT_BASE_URL = 'https://api.etherscan.io/v2/api';
const NO_RESULTS = new Set(['No transactions found', 'No records found', 'No logs found']);

class EtherscanApiError extends Error {
  constructor(message, { action, status, result } = {}) {
    super(message);
    this.name = 'EtherscanApiError';
    this.action = action;
    this.status = status;
    this.result = result;
  }
}

function toBlockNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function normalizeTransaction(transaction, kind, extra = {}) {
  return {
    hash: transaction.hash || transaction.blockHash,
    blockNumber: toBlockNumber(transaction.blockNumber),
    timestamp: transaction.timeStamp ? new Date(Number(transaction.timeStamp) * 1000).toISOString() : undefined,
    from: transaction.from,
    to: transaction.to || transaction.contractAddress,
    kind,
    ...extra
  };
}

class EtherscanBlockchainProvider extends BlockchainProvider {
  constructor({ apiKey = process.env.ETHERSCAN_API_KEY, chainId = 1, baseUrl = DEFAULT_BASE_URL, fetchImpl = globalThis.fetch, pageSize = 100, maxPages = 10 } = {}) {
    super();
    if (!apiKey) throw new Error('ETHERSCAN_API_KEY is required for the Etherscan provider');
    if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required');
    this.mode = 'REAL';
    this.apiKey = apiKey;
    this.chainId = String(chainId);
    this.baseUrl = baseUrl;
    this.fetchImpl = fetchImpl;
    this.pageSize = pageSize;
    this.maxPages = maxPages;
  }

  async request(action, params = {}) {
    const url = new URL(this.baseUrl);
    url.search = new URLSearchParams({ chainid: this.chainId, module: params.module || 'account', action, ...params, apikey: this.apiKey }).toString();
    let response;
    try {
      response = await this.fetchImpl(url);
    } catch (error) {
      throw new EtherscanApiError(`Etherscan request failed: ${error.message}`, { action });
    }
    if (!response.ok) throw new EtherscanApiError(`Etherscan HTTP ${response.status}`, { action, status: response.status });
    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      throw new EtherscanApiError(`Etherscan returned invalid JSON: ${error.message}`, { action });
    }
    if (payload.status === '1') return payload.result;
    if (NO_RESULTS.has(payload.message) || NO_RESULTS.has(payload.result)) return [];
    throw new EtherscanApiError(`Etherscan ${action} failed: ${payload.result || payload.message || 'unknown error'}`, { action, result: payload.result, status: payload.status });
  }

  async paged(action, params) {
    const records = [];
    for (let page = 1; page <= this.maxPages; page += 1) {
      const pageRecords = await this.request(action, { ...params, page, offset: this.pageSize });
      if (!Array.isArray(pageRecords)) throw new EtherscanApiError(`Etherscan ${action} returned a non-list result`, { action });
      records.push(...pageRecords);
      if (pageRecords.length < this.pageSize) break;
    }
    return records;
  }

  async getAddressType(address) {
    return 'UNKNOWN';
  }

  async getTransactions(address) {
    const [normal, internal, transfers] = await Promise.all([
      this.paged('txlist', { address, startblock: 0, endblock: 99999999, sort: 'asc' }),
      this.paged('txlistinternal', { address, startblock: 0, endblock: 99999999, sort: 'asc' }),
      this.paged('tokentx', { address, startblock: 0, endblock: 99999999, sort: 'asc' })
    ]);
    return [
      ...normal.map((item) => normalizeTransaction(item, 'CONTRACT_INTERACTION')),
      ...internal.map((item) => normalizeTransaction(item, 'CONTRACT_INTERACTION', { internal: true })),
      ...transfers.map((item) => normalizeTransaction(item, 'TOKEN_TRANSFER', { tokenAddress: item.contractAddress, tokenSymbol: item.tokenSymbol, value: item.value }))
    ].filter((item) => item.hash);
  }

  async getTokenApprovals() {
    throw new EtherscanApiError('ERC-20 allowance state requires the RPC adapter', { action: 'getTokenApprovals' });
  }

  async getTokenBalance() {
    throw new EtherscanApiError('Token balance state requires the RPC adapter', { action: 'getTokenBalance' });
  }

  async getContractMetadata(address) {
    const result = await this.request('getsourcecode', { module: 'contract', address });
    const source = result[0];
    if (!source) return null;
    return {
      contractAddress: address,
      contractName: source.ContractName || undefined,
      verified: Boolean(source.SourceCode),
      sourceCode: source.SourceCode || undefined,
      abi: source.ABI && source.ABI !== 'Contract source code not verified' ? source.ABI : undefined,
      proxy: source.Proxy === '1',
      implementation: source.Implementation || undefined,
      dependencies: []
    };
  }

  async getLogs(address) {
    const logs = await this.paged('getlogs', { module: 'logs', address, fromBlock: 0, toBlock: 'latest' });
    return logs.map((log) => ({
      transactionHash: log.transactionHash,
      blockNumber: toBlockNumber(log.blockNumber),
      contractAddress: log.address || address,
      event: 'LOG',
      topics: log.topics,
      data: log.data
    }));
  }

  async getOwner() {
    throw new EtherscanApiError('Owner state requires the RPC adapter', { action: 'getOwner' });
  }

  async getProxyImplementation() {
    throw new EtherscanApiError('Proxy storage requires the RPC adapter', { action: 'getProxyImplementation' });
  }
}

module.exports = { EtherscanBlockchainProvider, EtherscanApiError };