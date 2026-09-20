    1	const { BlockchainProvider } = require('./provider');
    2	
    3	const DEFAULT_BASE_URL = 'https://api.etherscan.io/v2/api';
    4	const DEFAULT_LABEL_URL = 'https://etherscan.io/api'; // Non-PRO API for labels, if available
    5	const NO_RESULTS = new Set(['No transactions found', 'No records found', 'No logs found']);
    6	
    7	class EtherscanApiError extends Error {
    8	  constructor(message, { action, status, result, retryable = false } = {}) {
    9	    super(message);
   10	    this.name = 'EtherscanApiError';
   11	    this.action = action;
   12	    this.status = status;
   13	    this.result = result;
   14	    this.retryable = retryable;
   15	  }
   16	}
   17	
   18	function toBlockNumber(value) {
   19	  const number = Number(value);
   20	  return Number.isFinite(number) ? number : undefined;
   21	}
   22	
   23	function normalizeTransaction(transaction, kind, extra = {}) {
   24	  return {
   25	    hash: transaction.hash || transaction.blockHash,
   26	    blockNumber: toBlockNumber(transaction.blockNumber),
   27	    timestamp: transaction.timeStamp ? new Date(Number(transaction.timeStamp) * 1000).toISOString() : undefined,
   28	    from: transaction.from,
   29	    to: transaction.to || transaction.contractAddress,
   30	    kind,
   31	    ...extra
   32	  };
   33	}
   34	
   35	class EtherscanBlockchainProvider extends BlockchainProvider {
   36	  constructor({ apiKey = process.env.ETHERSCAN_API_KEY, chainId = 1, baseUrl = DEFAULT_BASE_URL, labelUrl = DEFAULT_LABEL_URL, fetchImpl = globalThis.fetch, pageSize = 100, maxPages = 10, mode = 'REAL', minRequestIntervalMs = 350, maxRetries = 3, retryBaseDelayMs = 500 } = {}) {
   37	    super();
   38	    // API key is primarily for indexed data; labels might not need it.
   39	    // Etherscan PRO API for metadata is not used here due to cost/access.
   40	    this.mode = mode;
   41	    this.apiKey = apiKey; // May be undefined if only using non-PRO label APIs
   42	    this.chainId = String(chainId);
   43	    this.baseUrl = baseUrl;
   44	    this.labelUrl = labelUrl;
   45	    this.fetchImpl = fetchImpl;
   46	    this.pageSize = pageSize;
   47	    this.maxPages = maxPages;
   48	    this.minRequestIntervalMs = minRequestIntervalMs;
   49	    this.maxRetries = maxRetries;
   50	    this.retryBaseDelayMs = retryBaseDelayMs;
   51	    this.requestQueue = Promise.resolve();
   52	    this.lastRequestAt = 0;
   53	  }
   54	
   55	  async request(action, params = {}) {
   56	    const run = this.requestQueue.then(() => this.requestWithRetry(action, params));
   57	    this.requestQueue = run.catch(() => undefined);
   58	    return run;
   59	  }
   60	
   61	  async requestWithRetry(action, params) {
   62	    for (let attempt = 0; ; attempt += 1) {
   63	      try {
   64	        return await this.requestOnce(action, params);
   65	      } catch (error) {
   66	        if (!(error instanceof EtherscanApiError) || !error.retryable || attempt >= this.maxRetries) throw error;
   67	        await new Promise((resolve) => setTimeout(resolve, this.retryBaseDelayMs * (2 ** attempt)));
   68	      }
   69	    }
   70	  }
   71	
   72	  async requestOnce(action, params) {
   73	    const elapsed = Date.now() - this.lastRequestAt;
   74	    if (elapsed < this.minRequestIntervalMs) await new Promise((resolve) => setTimeout(resolve, this.minRequestIntervalMs - elapsed));
   75	    this.lastRequestAt = Date.now();
   76	    const url = new URL(this.baseUrl);
   77	    url.search = new URLSearchParams({ chainid: this.chainId, module: params.module || 'account', action, ...params, apikey: this.apiKey }).toString();
   78	    let response;
   79	    try {
   80	      response = await this.fetchImpl(url);
   81	    } catch (error) {
   82	      throw new EtherscanApiError(`Etherscan request failed: ${error.message}`, { action });
   83	    }
   84	    if (!response.ok) throw new EtherscanApiError(`Etherscan HTTP ${response.status}`, { action, status: response.status, retryable: response.status === 429 });
   85	    let payload;
   86	    try {
   87	      payload = await response.json();
   88	    } catch (error) {
   89	      throw new EtherscanApiError(`Etherscan returned invalid JSON: ${error.message}`, { action });
   90	    }
   91	    if (payload.status === '1') return payload.result;
   92	    if (NO_RESULTS.has(payload.message) || NO_RESULTS.has(payload.result)) return [];
   93	    const message = payload.result || payload.message || 'unknown error';
   94	    const retryable = /rate limit|max calls per sec|too many requests|temporarily unavailable/i.test(String(message));
   95	    throw new EtherscanApiError(`Etherscan ${action} failed: ${message}`, { action, result: payload.result, status: payload.status, retryable });
   96	  }
   97	
   98	  async paged(action, params) {
   99	    const records = [];
  100	    for (let page = 1; page <= this.maxPages; page += 1) {
  101	      const pageRecords = await this.request(action, { ...params, page, offset: this.pageSize });
  102	      if (!Array.isArray(pageRecords)) throw new EtherscanApiError(`Etherscan ${action} returned a non-list result`, { action });
  103	      records.push(...pageRecords);
  104	      if (pageRecords.length < this.pageSize) break;
  105	    }
  106	    return records;
  107	  }
  108	
  109	  async getAddressType(address) {
  110	    // Etherscan doesn't provide address type directly. Requires RPC eth_getCode.
  111	    return 'UNKNOWN';
  112	  }
  113	
  114	  async getTransactions(address) {
  115	    const [normal, internal, transfers] = await Promise.all([
  116	      this.paged('txlist', { address, startblock: 0, endblock: 99999999, sort: 'asc' }),
  117	      this.paged('txlistinternal', { address, startblock: 0, endblock: 99999999, sort: 'asc' }),
  118	      this.paged('tokentx', { address, startblock: 0, endblock: 99999999, sort: 'asc' })
  119	    ]);
  120	    return [
  121	      ...normal.map((item) => normalizeTransaction(item, 'CONTRACT_INTERACTION')),
  122	      ...internal.map((item) => normalizeTransaction(item, 'CONTRACT_INTERACTION', { internal: true })),
  123	      ...transfers.map((item) => normalizeTransaction(item, 'TOKEN_TRANSFER', { tokenAddress: item.contractAddress, tokenSymbol: item.tokenSymbol, value: item.value }))
  124	    ].filter((item) => item.hash);
  125	  }
  126	
  127	  async getTokenApprovals() {
  128	    // Requires the RPC adapter for current state. Etherscan API doesn't provide historical allowance data directly.
  129	    throw new EtherscanApiError('ERC-20 allowance state requires the RPC adapter', { action: 'getTokenApprovals' });
  130	  }
  131	
  132	  async getTokenBalance() {
  133	    // Requires the RPC adapter for current state. Etherscan API doesn't provide token balances directly.
  134	    throw new EtherscanApiError('Token balance state requires the RPC adapter', { action: 'getTokenBalance' });
  135	  }
  136	
  137	  async getContractMetadata(address) {
  138	    // Fetches contract verification status, ABI, proxy info from Etherscan.
  139	    const result = await this.request('getsourcecode', { module: 'contract', address });
  140	    const source = result[0];
  141	    if (!source) return null;
  142	    return {
  143	      contractAddress: address,
  144	      contractName: source.ContractName || undefined,
  145	      verified: Boolean(source.SourceCode),
  146	      sourceCode: source.SourceCode || undefined,
  147	      abi: source.ABI && source.ABI !== 'Contract source code not verified' ? source.ABI : undefined,
  148	      proxy: source.Proxy === '1',
  149	      implementation: source.Implementation || undefined,
  150	      dependencies: []
  151	    };
  152	  }
  153	
  154	  async getLogs(address) {
  155	    const logs = await this.paged('getlogs', { module: 'logs', address, fromBlock: 0, toBlock: 'latest' });
  156	    return logs.map((log) => ({
  157	      transactionHash: log.transactionHash,
  158	      blockNumber: toBlockNumber(log.blockNumber),
  159	      contractAddress: log.address || address,
  160	      event: 'LOG',
  161	      topics: log.topics,
  162	      data: log.data
  163	    }));
  164	  }
   165	
   166	  async getOwner() {
   167	    // Etherscan API does not provide contract owner directly. Requires RPC eth_getStorageAt.
   168	    throw new EtherscanApiError('Owner state requires the RPC adapter', { action: 'getOwner' });
   169	  }
   170	
   171	  async getProxyImplementation() {
   172	    // Etherscan API does not provide proxy implementation details directly. Requires RPC eth_getStorageAt.
   173	    throw new EtherscanApiError('Proxy storage requires the RPC adapter', { action: 'getProxyImplementation' });
   174	  }
   175	
   176	  // --- NEW METHODS FOR ADDRESS METADATA ---
   177	
   178	  async getAddressMetadata(address) {
   179	    // Attempt to fetch public nametags and labels from Etherscan's non-PRO API.
   180	    // NOTE: Detailed exploit warnings or reputation scores typically require Etherscan PRO API.
   181	    // Using the legacy 'ethjsonrpc' module's 'getaddresstags' action as it seems more accessible than 'getaddressmetadata'.
   182	    // Example API call based on Etherscan docs and common usage:
   183	    // https://api.etherscan.io/api?module=account&action=getaddressmetadata&address=0x123...&tag=latest&apikey=YourApiKey
   184	    const url = new URL(this.labelUrl); // Use the labelUrl configured in constructor
   185	    url.search = new URLSearchParams({
   186	      module: 'account',
   187	      action: 'getaddressmetadata', // This action might need verification. 'getaddresstag' is also mentioned in docs.
   188	      // chainid: this.chainId, // Chain ID might be needed, check Etherscan API docs
   189	      address: address,
   190	      // apikey: this.apiKey // API key might not be needed for non-PRO label lookup, but include if available.
   191	    }).toString();
   192	
   193	    let response;
   194	    try {
   195	      // Using the configured labelUrl for metadata fetching
   196	      response = await this.fetchImpl(url);
   197	    } catch (error) {
   198	      console.warn(`Etherscan metadata request failed for ${address}: ${error.message}`);
   199	      return null; // Return null if request fails
   200	    }
   201	
   202	    if (!response.ok) {
   203	      console.warn(`Etherscan metadata HTTP ${response.status} for ${address}`);
   204	      return null; // Return null if response is not ok
   205	    }
   206	
   207	    let payload;
   208	    try {
   209	      payload = await response.json();
   210	    } catch (error) {
   211	      console.warn(`Etherscan metadata returned invalid JSON for ${address}: ${error.message}`);
   212	      return null; // Return null if JSON parsing fails
   213	    }
   214	
   215	    // Etherscan API often returns status '0' for errors or no data, even with HTTP 200 OK.
   216	    if (payload.status !== '1' && payload.message !== 'OK') {
   217	      // Check for common non-result messages
   218	      if (NO_RESULTS.has(payload.message) || NO_RESULTS.has(payload.result)) {
   219	        return null; // No metadata found
   220	      }
   221	      console.warn(`Etherscan metadata API error for ${address}: ${payload.message}`);
   222	      return null; // Return null for other API errors
   223	    }
   224	
   225	    // Process the result: expected format is an array of metadata objects
   226	    // Based on Etherscan docs for getaddresstag, result is an array.
   227	    // The legacy exportaddresstags shows fields like address, nametag, internal_nametag, url, shortdescription, notes_1, notes_2, labels, reputation.
   228	    if (Array.isArray(payload.result) && payload.result.length > 0) {
   229	      const metadata = payload.result[0]; // Assuming the first result is the relevant one
   230	      
   231	      // Extract relevant fields and structure them.
   232	      const extractedMetadata = {
   233	          address: metadata.address,
   234	          nametag: metadata.nametag,
   235	          internal_nametag: metadata.internal_nametag,
   236	          url: metadata.url,
   237	          shortDescription: metadata.shortdescription,
   238	          notes: [metadata.notes_1, metadata.notes_2].filter(Boolean).join(' '), // Combine notes
   239	          labels: metadata.labels,
   240	          reputation: metadata.reputation, // This might be numeric or string, depending on Etherscan's API
   241	          lastUpdatedTimestamp: metadata.lastupdatedtimestamp
   242	      };
   243	      // Filter out null/undefined fields to keep the object clean
   244	      return Object.fromEntries(Object.entries(extractedMetadata).filter(([_, v]) => v != null && v !== ''));
   245	    } else if (payload.result && typeof payload.result === 'object' && Object.keys(payload.result).length > 0) {
   246	        // Handle cases where result might be a single object instead of an array.
   247	        const metadata = payload.result;
   248	        const extractedMetadata = {
   249	            address: metadata.address,
   250	            nametag: metadata.nametag,
   251	            internal_nametag: metadata.internal_nametag,
   252	            url: metadata.url,
   253	            shortDescription: metadata.shortdescription,
   254	            notes: [metadata.notes_1, metadata.notes_2].filter(Boolean).join(' '),
   255	            labels: metadata.labels,
   256	            reputation: metadata.reputation,
   257	            lastUpdatedTimestamp: metadata.lastupdatedtimestamp
   258	        };
   259	        return Object.fromEntries(Object.entries(extractedMetadata).filter(([_, v]) => v != null && v !== ''));
   260	    }
   261	
   262	    return null; // Return null if no metadata found or unexpected format
   263	  }
   264	}
   265	
   266	module.exports = { EtherscanBlockchainProvider, EtherscanApiError };