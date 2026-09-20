const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ADDRESSES,
  RpcBlockchainProvider,
  CompositeBlockchainProvider,
  safeBigInt,
  analyzeAddressSecurity
} = require('../src/security-engine');

test('safeBigInt converts valid values and safely handles empty, 0x, and malformed hex', () => {
  assert.equal(safeBigInt('0x1'), 1n);
  assert.equal(safeBigInt('0x01'), 1n);
  assert.equal(safeBigInt('0xff'), 255n);
  assert.equal(safeBigInt(100), 100n);
  assert.equal(safeBigInt(100n), 100n);

  // Fallback / edge cases that used to throw SyntaxError: Cannot convert 0x to a BigInt
  assert.equal(safeBigInt('0x'), 0n);
  assert.equal(safeBigInt('0x0'), 0n);
  assert.equal(safeBigInt('0x0000'), 0n);
  assert.equal(safeBigInt(''), 0n);
  assert.equal(safeBigInt(null), 0n);
  assert.equal(safeBigInt(undefined), 0n);
  assert.equal(safeBigInt('not-hex', 42n), 42n);
  assert.equal(safeBigInt('0x', 99n), 99n);
});

test('RPC provider bounds historical eth_getLogs to recent window without querying block 0', async () => {
  const queriedRanges = [];
  const rpcFetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    if (request.method === 'eth_blockNumber') {
      // Mainnet height at block 21,000,000 (0x1406f40)
      return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x1406f40' }) };
    }
    if (request.method === 'eth_getLogs') {
      queriedRanges.push({
        fromBlock: Number.parseInt(request.params[0].fromBlock, 16),
        toBlock: Number.parseInt(request.params[0].toBlock, 16)
      });
      return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: [] }) };
    }
    if (request.method === 'eth_call') {
      return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x0' }) };
    }
    throw new Error(`Unexpected method: ${request.method}`);
  };

  const provider = new RpcBlockchainProvider({
    rpcUrl: 'https://rpc.mock',
    fetchImpl: rpcFetch,
    approvalBlockRange: 10000,
    logBlockRange: 5000
  });

  const approvals = await provider.getTokenApprovals(ADDRESSES.wallet);
  assert.deepEqual(approvals, []);
  assert.ok(queriedRanges.length > 0 && queriedRanges.length <= 3);
  // Ensured that it didn't start querying from block 0!
  assert.ok(queriedRanges[0].fromBlock >= 21000000 - 10000);
});

test('RPC provider dynamically shrinks chunk size when RPC returns block range error', async () => {
  let attempts = 0;
  const queriedChunkSizes = [];
  const rpcFetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    if (request.method === 'eth_blockNumber') {
      return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x2710' }) }; // Block 10,000
    }
    if (request.method === 'eth_getLogs') {
      attempts += 1;
      const from = Number.parseInt(request.params[0].fromBlock, 16);
      const to = Number.parseInt(request.params[0].toBlock, 16);
      const size = to - from;
      queriedChunkSizes.push(size);
      if (size > 1000) {
        // Simulate public node range restriction error
        return {
          ok: true,
          json: async () => ({
            jsonrpc: '2.0',
            id: 1,
            error: { code: -32005, message: 'query returned more than 10000 results or block range too large' }
          })
        };
      }
      return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: [] }) };
    }
    throw new Error(`Unexpected method: ${request.method}`);
  };

  const provider = new RpcBlockchainProvider({
    rpcUrl: 'https://rpc.mock',
    fetchImpl: rpcFetch,
    logBlockRange: 4000,
    approvalBlockRange: 2000
  });

  const logs = await provider.getLogsInRanges({ fromBlock: 8000, toBlock: 10000 });
  assert.ok(Array.isArray(logs));
  assert.ok(attempts > 1);
  // Verified that it shrunk chunk size from 4000 down to <= 1000
  assert.ok(queriedChunkSizes.some((size) => size <= 1000));
});

test('RPC provider handles reverts and empty 0x results gracefully on contract calls', async () => {
  const rpcFetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    if (request.method === 'eth_call') {
      const calldata = request.params[0].data;
      // Revert balanceOf call for non-standard or destroyed contract
      if (calldata.startsWith('0x70a08231')) {
        return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, error: { code: 3, message: 'execution reverted' } }) };
      }
      // Return empty 0x for decimals
      if (calldata.startsWith('0x313ce567')) {
        return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x' }) };
      }
      // Revert symbol
      if (calldata.startsWith('0x95d89b41')) {
        return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, error: { code: 3, message: 'execution reverted' } }) };
      }
      // Owner call returns empty 0x
      if (calldata.startsWith('0x8da5cb5b')) {
        return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x' }) };
      }
    }
    if (request.method === 'eth_getBalance') {
      return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x' }) };
    }
    if (request.method === 'eth_getStorageAt') {
      return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x0' }) };
    }
    throw new Error(`Unexpected method: ${request.method}`);
  };

  const provider = new RpcBlockchainProvider({
    rpcUrl: 'https://rpc.mock',
    fetchImpl: rpcFetch
  });

  // Does NOT throw SyntaxError or RPC revert error
  const balance = await provider.getTokenBalance(ADDRESSES.wallet, ADDRESSES.token);
  assert.equal(balance.raw, '0');
  assert.equal(balance.decimals, 18);
  assert.equal(balance.symbol, undefined);

  const native = await provider.getNativeBalance(ADDRESSES.wallet);
  assert.equal(native, '0');

  const owner = await provider.getOwner(ADDRESSES.protocol);
  assert.equal(owner, null);

  const proxy = await provider.getProxyImplementation(ADDRESSES.protocol);
  assert.equal(proxy, null);
});

test('RPC provider retries on HTTP 429 rate limit with exponential backoff', async () => {
  let callCount = 0;
  const rpcFetch = async () => {
    callCount += 1;
    if (callCount < 3) {
      return { ok: false, status: 429, json: async () => ({}) };
    }
    return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x1234' }) };
  };

  const provider = new RpcBlockchainProvider({
    rpcUrl: 'https://rpc.mock',
    fetchImpl: rpcFetch,
    maxRetries: 3,
    retryBaseDelayMs: 5
  });

  const blockNumber = await provider.rpc('eth_blockNumber');
  assert.equal(blockNumber, '0x1234');
  assert.equal(callCount, 3);
});

test('CompositeBlockchainProvider functions safely with only RPC subprovider', async () => {
  const rpcFetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    if (request.method === 'eth_getCode') {
      return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x' }) };
    }
    if (request.method === 'eth_getBalance') {
      return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x100' }) };
    }
    if (request.method === 'eth_blockNumber') {
      return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x10' }) };
    }
    if (request.method === 'eth_getLogs') {
      return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: [] }) };
    }
    return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x0' }) };
  };

  const rpc = new RpcBlockchainProvider({ rpcUrl: 'https://rpc.mock', fetchImpl: rpcFetch });
  // Composite with indexer absent
  const composite = new CompositeBlockchainProvider({ rpc });

  assert.equal(await composite.getAddressType(ADDRESSES.wallet), 'EOA');
  assert.equal(await composite.getNativeBalance(ADDRESSES.wallet), '256');
  // Safe empty fallbacks for indexer methods rather than crashes
  assert.deepEqual(await composite.getTransactions(ADDRESSES.wallet), []);
  assert.deepEqual(await composite.getLogs(ADDRESSES.wallet), []);
  assert.equal(await composite.getAddressMetadata(ADDRESSES.wallet), null);
});

test('analyzeAddressSecurity rejects invalid address formats with explicit UNKNOWN finding', async () => {
  const rpcFetch = async () => {
    throw new Error('Should not make any RPC requests for invalid address');
  };
  const provider = new RpcBlockchainProvider({ rpcUrl: 'https://rpc.mock', fetchImpl: rpcFetch });

  // Malformed EVM address (too short)
  const result = await analyzeAddressSecurity({ provider, address: '0x123', chain: 'ethereum' });
  assert.equal(result.addressType, 'UNKNOWN');
  const finding = result.evidence.find((item) => item.findingType === 'ADDRESS_CLASSIFICATION');
  assert.equal(finding.knowledgeType, 'UNKNOWN');
  assert.match(finding.coverageGaps[0], /Invalid EVM address format/);
});
