const test = require('node:test');
const assert = require('node:assert/strict');
const { ADDRESSES, CompositeBlockchainProvider, EtherscanBlockchainProvider, EtherscanApiError, RpcBlockchainProvider, analyzeAddressSecurity, createEthereumProvider } = require('../src/security-engine');

function etherscanFetch(url) {
  const query = new URL(url).searchParams;
  const action = query.get('action');
  const resultByAction = {
    txlist: [{ hash: '0xtx', blockNumber: '12', timeStamp: '1704067200', from: ADDRESSES.wallet, to: ADDRESSES.protocol }],
    txlistinternal: [{ hash: '0xinternal', blockNumber: '13', timeStamp: '1704067300', from: ADDRESSES.protocol, to: ADDRESSES.wallet }],
    tokentx: [{ hash: '0xtoken', blockNumber: '14', timeStamp: '1704067400', from: ADDRESSES.wallet, to: ADDRESSES.spender, contractAddress: ADDRESSES.token, tokenSymbol: 'DEMO', value: '10' }],
    getsourcecode: [{ ContractName: 'DemoProtocol', SourceCode: 'contract DemoProtocol {}', ABI: '[]', Proxy: '0', Implementation: '' }],
    getlogs: [{ transactionHash: '0xlog', blockNumber: '15', address: ADDRESSES.protocol, topics: ['0xevent'], data: '0x00' }]
  };
  const result = resultByAction[action] || [];
  return Promise.resolve({ ok: true, json: async () => ({ status: '1', message: 'OK', result }) });
}

test('Etherscan adapter normalizes historical and verified-contract data', async () => {
  const provider = new EtherscanBlockchainProvider({ apiKey: 'fixture-key', fetchImpl: etherscanFetch, pageSize: 100, mode: 'FIXTURE' });
  const transactions = await provider.getTransactions(ADDRESSES.wallet);
  assert.deepEqual(transactions.map((item) => item.kind), ['CONTRACT_INTERACTION', 'CONTRACT_INTERACTION', 'TOKEN_TRANSFER']);
  assert.equal(transactions[1].internal, true);
  assert.equal(transactions[2].tokenAddress, ADDRESSES.token);
  assert.equal((await provider.getContractMetadata(ADDRESSES.protocol)).verified, true);
  assert.equal((await provider.getLogs(ADDRESSES.protocol))[0].event, 'LOG');
  assert.equal(await provider.getAddressType(ADDRESSES.wallet), 'UNKNOWN');
});

test('Etherscan adapter failures are explicit and unsupported direct reads do not fabricate state', async () => {
  const provider = new EtherscanBlockchainProvider({ apiKey: 'fixture-key', fetchImpl: async () => ({ ok: true, json: async () => ({ status: '0', message: 'NOTOK', result: 'Max rate limit reached' }) }), mode: 'FIXTURE', maxRetries: 0 });
  await assert.rejects(() => provider.getTransactions(ADDRESSES.wallet), (error) => error instanceof EtherscanApiError && /rate limit/i.test(error.message));
  await assert.rejects(() => provider.getTokenApprovals(ADDRESSES.wallet), /RPC adapter/);
});

test('Etherscan serializes requests and retries rate limits without concurrent bursts', async () => {
  let active = 0;
  let maximumActive = 0;
  let calls = 0;
  const fetchImpl = async () => {
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 1));
    active -= 1;
    if (calls === 1) return { ok: true, json: async () => ({ status: '0', message: 'NOTOK', result: 'Max calls per sec rate limit reached' }) };
    return { ok: true, json: async () => ({ status: '1', message: 'OK', result: [] }) };
  };
  const provider = new EtherscanBlockchainProvider({ apiKey: 'fixture-key', fetchImpl, mode: 'FIXTURE', minRequestIntervalMs: 0, retryBaseDelayMs: 1, maxRetries: 2 });
  await Promise.all([provider.request('txlist'), provider.request('tokentx')]);
  assert.equal(maximumActive, 1);
  assert.equal(calls, 3);
});

test('indexed Etherscan data becomes the existing EvidenceBundle', async () => {
  const provider = new EtherscanBlockchainProvider({ apiKey: 'fixture-key', fetchImpl: etherscanFetch, mode: 'FIXTURE' });
  const bundle = await analyzeAddressSecurity({ provider, address: ADDRESSES.wallet, chain: 'ethereum' });
  const transfer = bundle.evidence.find((item) => item.findingType === 'TOKEN_TRANSFER');
  assert.equal(bundle.schemaVersion, '1.0');
  assert.equal(bundle.dataMode, 'FIXTURE');
  assert.equal(transfer.knowledgeType, 'OBSERVED');
  assert.equal(transfer.transactionHash, '0xtoken');
  assert.equal(transfer.token, ADDRESSES.token);
  assert.ok(bundle.evidence.some((item) => item.knowledgeType === 'UNKNOWN'));
  assert.ok(bundle.coverageGaps.length > 0);
});

test('composite provider routes indexed history to Etherscan and direct state to RPC', async () => {
  const calls = [];
  const indexer = { mode: 'REAL', getTransactions: async () => [{ hash: '0xindexed', kind: 'CONTRACT_INTERACTION' }], getContractMetadata: async () => null, getLogs: async () => [] };
  const rpc = { mode: 'REAL', getAddressType: async () => 'EOA', getTokenApprovals: async () => [], getTokenBalance: async () => ({ raw: '0', decimals: 18 }), getContractMetadata: async () => null, getOwner: async () => null, getProxyImplementation: async () => null };
  const provider = new CompositeBlockchainProvider({ indexer, rpc });
  provider.indexer.getTransactions = async () => { calls.push('indexer'); return [{ hash: '0xindexed', kind: 'CONTRACT_INTERACTION' }]; };
  provider.rpcProvider.getTokenBalance = async () => { calls.push('rpc'); return { raw: '0', decimals: 18 }; };
  assert.equal((await provider.getTransactions(ADDRESSES.wallet))[0].hash, '0xindexed');
  await provider.getTokenBalance(ADDRESSES.wallet, ADDRESSES.token);
  assert.deepEqual(calls, ['indexer', 'rpc']);
});

test('provider factory uses demo mode when real credentials are absent', () => {
  const provider = createEthereumProvider({ apiKey: undefined, rpcUrl: undefined });
  assert.equal(provider.mode, 'DEMO');
});

test('RPC adapter reads code and EIP-1967 state through JSON-RPC', async () => {
  const rpcFetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    const results = { eth_getCode: '0x6000', eth_blockNumber: '0x2710', eth_getStorageAt: `0x${'0'.repeat(24)}${ADDRESSES.implementation.slice(2)}` };
    return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: results[request.method] }) };
  };
  const provider = new RpcBlockchainProvider({ rpcUrl: 'https://rpc.fixture', fetchImpl: rpcFetch, mode: 'FIXTURE' });
  assert.equal(await provider.getAddressType(ADDRESSES.protocol), 'SMART_CONTRACT');
  assert.equal((await provider.getProxyImplementation(ADDRESSES.protocol)).implementationAddress, ADDRESSES.implementation);
});

test('RPC approval lookup uses bounded ranges and exact allowance calldata', async () => {
  const requests = [];
  const rpcFetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    requests.push(request);
    if (request.method === 'eth_blockNumber') return { ok: true, json: async () => ({ result: '0x2' }) };
    if (request.method === 'eth_getLogs') return { ok: true, json: async () => ({ result: [{ address: ADDRESSES.token, transactionHash: '0xapproval', blockNumber: '0x2', topics: ['0xapproval', `0x${ADDRESSES.wallet.slice(2).padStart(64, '0')}`, `0x${ADDRESSES.spender.slice(2).padStart(64, '0')}`], data: '0x01' }] }) };
    if (request.method === 'eth_call') return { ok: true, json: async () => ({ result: '0x01' }) };
    throw new Error(`Unexpected method ${request.method}`);
  };
  const provider = new RpcBlockchainProvider({ rpcUrl: 'https://rpc.fixture', fetchImpl: rpcFetch, mode: 'FIXTURE', logBlockRange: 1 });
  const approvals = await provider.getTokenApprovals(ADDRESSES.wallet);
  const logRequest = requests.find((request) => request.method === 'eth_getLogs');
  const allowanceRequest = requests.find((request) => request.method === 'eth_call');
  assert.equal(approvals[0].active, true);
  assert.match(logRequest.params[0].fromBlock, /^0x/);
  assert.match(logRequest.params[0].toBlock, /^0x/);
  assert.equal(allowanceRequest.params[0].data, `0xdd62ed3e${ADDRESSES.wallet.slice(2).padStart(64, '0')}${ADDRESSES.spender.slice(2).padStart(64, '0')}`);
});