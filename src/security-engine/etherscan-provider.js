const { BlockchainProvider } = require('./provider');

const DEFAULT_BASE_URL = 'https://api.etherscan.io/v2/api';
const DEFAULT_LABEL_URL = 'https://etherscan.io/api'; // Non-PRO API for labels, if available
const NO_RESULTS = new Set(['No transactions found', 'No records found', 'No logs found']);

class EtherscanApiError extends Error {
  constructor(message, { action, status, result, retryable = false } = {}) {
    super(message);
    this.name = 'EtherscanApiError';
    this.action = action;
    this.status = status;
    this.result = result;
    this.retryable = retryable;
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
  constructor({ apiKey = process.env.ETHERSCAN_API_KEY, chainId = 1, baseUrl = DEFAULT_BASE_URL, labelUrl = DEFAULT_LABEL_URL, fetchImpl = globalThis.fetch, pageSize = 100, maxPages = 10, mode = 'REAL', minRequestIntervalMs = 350, maxRetries = 3, retryBaseDelayMs = 500 } = {}) {
    super();
    // API key is primarily for indexed data; labels might not need it.
    // Etherscan PRO API for metadata is not used here due to cost/access.
    this.mode = mode;
    this.apiKey = apiKey; // May be undefined if only using non-PRO label APIs
    this.chainId = String(chainId);
    this.baseUrl = baseUrl;
    this.labelUrl = labelUrl;
    this.fetchImpl = fetchImpl;
    this.pageSize = pageSize;
    this.maxPages = maxPages;
    this.minRequestIntervalMs = minRequestIntervalMs;
    this.maxRetries = maxRetries;
    this.retryBaseDelayMs = retryBaseDelayMs;
    this.requestQueue = Promise.resolve();
    this.lastRequestAt = 0;
  }

  async request(action, params = {}) {
    const run = this.requestQueue.then(() => this.requestWithRetry(action, params));
    this.requestQueue = run.catch(() => undefined);
    return run;
  }

  async requestWithRetry(action, params) {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await this.requestOnce(action, params);
      } catch (error) {
        if (!(error instanceof EtherscanApiError) || !error.retryable || attempt >= this.maxRetries) throw error;
        await new Promise((resolve) => setTimeout(resolve, this.retryBaseDelayMs * (2 ** attempt)));
      }
    }
  }

  async requestOnce(action, params) {
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < this.minRequestIntervalMs) await new Promise((resolve) => setTimeout(resolve, this.minRequestIntervalMs - elapsed));
    this.lastRequestAt = Date.now();
    const url = new URL(this.baseUrl);
    url.search = new URLSearchParams({ chainid: this.chainId, module: params.module || 'account', action, ...params, apikey: this.apiKey }).toString();
    let response;
    try {
      response = await this.fetchImpl(url);
    } catch (error) {
      throw new EtherscanApiError(`Etherscan request failed: ${error.message}`, { action });
    }
    if (!response.ok) throw new EtherscanApiError(`Etherscan HTTP ${response.status}`, { action, status: response.status, retryable: response.status === 429 });
    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      throw new EtherscanApiError(`Etherscan returned invalid JSON: ${error.message}`, { action });
    }
    if (payload.status === '1') return payload.result;
    if (NO_RESULTS.has(payload.message) || NO_RESULTS.has(payload.result)) return [];
    const message = payload.result || payload.message || 'unknown error';
    const retryable = /rate limit|max calls per sec|too many requests|temporarily unavailable/i.test(String(message));
    throw new EtherscanApiError(`Etherscan ${action} failed: ${message}`, { action, result: payload.result, status: payload.status, retryable });
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
    // Etherscan doesn't provide address type directly. Requires RPC eth_getCode.
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
    // Requires the RPC adapter for current state. Etherscan API doesn't provide historical allowance data directly.
    throw new EtherscanApiError('ERC-20 allowance state requires the RPC adapter', { action: 'getTokenApprovals' });
  }

  async getTokenBalance() {
    // Requires the RPC adapter for current state. Etherscan API doesn't provide token balances directly.
    throw new EtherscanApiError('Token balance state requires the RPC adapter', { action: 'getTokenBalance' });
  }

  async getContractMetadata(address) {
    // Fetches contract verification status, ABI, proxy info from Etherscan.
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
    // Etherscan API does not provide contract owner directly. Requires RPC eth_getStorageAt.
    throw new EtherscanApiError('Owner state requires the RPC adapter', { action: 'getOwner' });
  }

  async getProxyImplementation() {
    // Etherscan API does not provide proxy implementation details directly. Requires RPC eth_getStorageAt.
    throw new EtherscanApiError('Proxy storage requires the RPC adapter', { action: 'getProxyImplementation' });
  }

  // --- NEW METHODS FOR ADDRESS METADATA ---

  async getAddressMetadata(address) {
    // Attempt to fetch public nametags and labels from Etherscan's non-PRO API.
    // NOTE: Detailed exploit warnings or reputation scores typically require Etherscan PRO API.
    // Using the legacy 'ethjsonrpc' module's 'getaddresstags' action as it seems more accessible than 'getaddressmetadata'.
    // Example API call based on Etherscan docs and common usage:
    // https://api.etherscan.io/api?module=account&action=getaddressmetadata&address=0x123...&tag=latest&apikey=YourApiKey
    const url = new URL(this.labelUrl); // Use the labelUrl configured in constructor
    url.search = new URLSearchParams({
      module: 'account',
      action: 'getaddressmetadata', // This action might need verification. 'getaddresstag' is also mentioned in docs.
      // chainid: this.chainId, // Chain ID might be needed, check Etherscan API docs
      address: address,
      // apikey: this.apiKey // API key might not be needed for non-PRO label lookup, but include if available.
    }).toString();

    let response;
    try {
      // Using the configured labelUrl for metadata fetching
      response = await this.fetchImpl(url);
    } catch (error) {
      console.warn(`Etherscan metadata request failed for ${address}: ${error.message}`);
      return null; // Return null if request fails
    }

    if (!response.ok) {
      console.warn(`Etherscan metadata HTTP ${response.status} for ${address}`);
      return null; // Return null if response is not ok
    }

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      console.warn(`Etherscan metadata returned invalid JSON for ${address}: ${error.message}`);
      return null; // Return null if JSON parsing fails
    }

    // Etherscan API often returns status '0' for errors or no data, even with HTTP 200 OK.
    if (payload.status !== '1' && payload.message !== 'OK') {
      // Check for common non-result messages
      if (NO_RESULTS.has(payload.message) || NO_RESULTS.has(payload.result)) {
        return null; // No metadata found
      }
      console.warn(`Etherscan metadata API error for ${address}: ${payload.message}`);
      return null; // Return null for other API errors
    }

    // Process the result: expected format is an array of metadata objects
    // Based on Etherscan docs for getaddresstag, result is an array.
    // The legacy exportaddresstags shows fields like address, nametag, internal_nametag, url, shortdescription, notes_1, notes_2, labels, reputation.
    if (Array.isArray(payload.result) && payload.result.length > 0) {
      const metadata = payload.result[0]; // Assuming the first result is the relevant one
      
      // Extract relevant fields and structure them.
      const extractedMetadata = {
          address: metadata.address,
          nametag: metadata.nametag,
          internal_nametag: metadata.internal_nametag,
          url: metadata.url,
          shortDescription: metadata.shortdescription,
          notes: [metadata.notes_1, metadata.notes_2].filter(Boolean).join(' '), // Combine notes
          labels: metadata.labels,
          reputation: metadata.reputation, // This might be numeric or string, depending on Etherscan's API
          lastUpdatedTimestamp: metadata.lastupdatedtimestamp
      };
      // Filter out null/undefined fields to keep the object clean
      return Object.fromEntries(Object.entries(extractedMetadata).filter(([_, v]) => v != null && v !== ''));
    } else if (payload.result && typeof payload.result === 'object' && Object.keys(payload.result).length > 0) {
        // Handle cases where result might be a single object instead of an array.
        const metadata = payload.result;
        const extractedMetadata = {
            address: metadata.address,
            nametag: metadata.nametag,
            internal_nametag: metadata.internal_nametag,
            url: metadata.url,
            shortDescription: metadata.shortdescription,
            notes: [metadata.notes_1, metadata.notes_2].filter(Boolean).join(' '),
            labels: metadata.labels,
            reputation: metadata.reputation,
            lastUpdatedTimestamp: metadata.lastupdatedtimestamp
        };
        return Object.fromEntries(Object.entries(extractedMetadata).filter(([_, v]) => v != null && v !== ''));
    }

    return null; // Return null if no metadata found or unexpected format
  }
}

module.exports = { EtherscanBlockchainProvider, EtherscanApiError };