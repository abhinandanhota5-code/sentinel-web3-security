const { BlockchainProvider } = require('./provider');

const APPROVAL_TOPIC = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925';
const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
const ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';

function paddedAddress(address) {
  return address.toLowerCase().replace(/^0x/, '').padStart(64, '0');
}

function addressFromWord(word) {
  if (!word || typeof word !== 'string' || word === '0x' || /^0x?0*$/i.test(word)) return undefined;
  const hex = word.replace(/^0x/, '');
  if (hex.length < 40) return undefined;
  return `0x${hex.slice(-40).toLowerCase()}`;
}

// EIP-7702 (Pectra): EOAs can delegate code. 0xef0100 || address is a
// delegation designator, not contract bytecode — the address remains an EOA.
// Shape: "0x" + 3-byte magic (6 hex) + 20-byte address (40 hex) = 48 chars.
const EIP7702_DELEGATION_PREFIX = 'ef0100';

function isDelegationDesignator(code) {
  if (typeof code !== 'string') return false;
  const hex = code.toLowerCase().replace(/^0x/, '');
  return hex.startsWith(EIP7702_DELEGATION_PREFIX) && hex.length === 46;
}

function quantityToNumber(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const number = Number.parseInt(String(value), 16);
  return Number.isFinite(number) ? number : undefined;
}

function safeBigInt(value, fallback = 0n) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? BigInt(Math.floor(value)) : fallback;
  }
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '0x' || trimmed === '0X' || /^0x?0*$/i.test(trimmed)) {
    return fallback;
  }
  try {
    return BigInt(trimmed);
  } catch {
    return fallback;
  }
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
  constructor({
    rpcUrl,
    fetchImpl = globalThis.fetch,
    mode = 'REAL',
    logBlockRange = 10000,
    approvalFromBlock,
    approvalBlockRange = 10000,
    maxLogChunks = 20,
    minRequestIntervalMs = 0,
    maxRetries = 3,
    retryBaseDelayMs = 300,
    timeoutMs = 15000
  } = {}) {
    super();
    if (!rpcUrl) throw new Error('ETHEREUM_RPC_URL is required for the RPC provider');
    if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required');
    this.mode = mode;
    this.rpcUrl = rpcUrl;
    this.fetchImpl = fetchImpl;
    this.logBlockRange = logBlockRange;
    this.approvalFromBlock = approvalFromBlock;
    this.approvalBlockRange = approvalBlockRange;
    this.maxLogChunks = maxLogChunks;
    this.minRequestIntervalMs = minRequestIntervalMs;
    this.maxRetries = maxRetries;
    this.retryBaseDelayMs = retryBaseDelayMs;
    this.timeoutMs = timeoutMs;
    this.requestId = 0;
    this.requestQueue = Promise.resolve();
    this.lastRequestAt = 0;
  }

  async rpc(method, params = []) {
    const run = this.requestQueue.then(() => this.rpcWithRetry(method, params));
    this.requestQueue = run.catch(() => undefined);
    return run;
  }

  async rpcWithRetry(method, params) {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await this.rpcOnce(method, params);
      } catch (error) {
        const isRetryable = error.retryable || /429|502|503|504|rate limit|too many|timeout|aborted|econnreset|etimedout/i.test(error.message);
        if (!isRetryable || attempt >= this.maxRetries) {
          throw error;
        }
        const delay = this.retryBaseDelayMs * (2 ** attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async rpcOnce(method, params) {
    if (this.minRequestIntervalMs > 0) {
      const elapsed = Date.now() - this.lastRequestAt;
      if (elapsed < this.minRequestIntervalMs) {
        await new Promise((resolve) => setTimeout(resolve, this.minRequestIntervalMs - elapsed));
      }
      this.lastRequestAt = Date.now();
    }

    let response;
    try {
      const fetchOpts = {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: ++this.requestId, method, params })
      };
      if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function' && this.timeoutMs > 0) {
        fetchOpts.signal = AbortSignal.timeout(this.timeoutMs);
      }
      response = await this.fetchImpl(this.rpcUrl, fetchOpts);
    } catch (error) {
      const err = new Error(`RPC request failed: ${error.message}`);
      err.retryable = /timeout|abort|network|fetch failed|econnreset|etimedout/i.test(error.message);
      throw err;
    }

    if (!response.ok) {
      const err = new Error(`RPC HTTP ${response.status}`);
      err.status = response.status;
      err.retryable = response.status === 429 || response.status >= 500;
      throw err;
    }

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      throw new Error(`RPC returned invalid JSON: ${error.message}`);
    }

    if (payload.error) {
      const message = payload.error.message || String(payload.error.code || 'unknown error');
      const err = new Error(`RPC ${method} failed: ${message}`);
      err.code = payload.error.code;
      err.data = payload.error.data;
      err.retryable = payload.error.code === -32005 || payload.error.code === 429 || /rate limit|too many requests/i.test(message);
      throw err;
    }

    return payload.result;
  }

  async getAddressType(address) {
    try {
      const code = await this.rpc('eth_getCode', [address, 'latest']);
      if (code === '0x' || !code) return 'EOA';
      if (isDelegationDesignator(code)) return 'EOA';
      return 'SMART_CONTRACT';
    } catch {
      return 'UNKNOWN';
    }
  }

  async getTransactions() {
    throw new Error('Transaction history requires the indexed provider');
  }

  async getTokenApprovals(address, chain) {
    let logs = [];
    try {
      logs = await this.getLogsInRanges({
        fromBlock: this.approvalFromBlock,
        topics: [APPROVAL_TOPIC, `0x${paddedAddress(address)}`]
      });
    } catch {
      logs = [];
    }
    const approvals = [];
    for (const log of logs) {
      const spenderAddress = addressFromWord(log.topics?.[2]);
      if (!spenderAddress) continue;
      const rawLogAllowance = safeBigInt(log.data).toString();
      let current;
      try {
        current = await this.call(
          log.address,
          '0xdd62ed3e',
          `${paddedAddress(address)}${paddedAddress(spenderAddress)}`
        );
      } catch {
        current = undefined;
      }
      const currentBigInt = current !== undefined ? safeBigInt(current) : undefined;
      const finalAllowance = currentBigInt !== undefined ? currentBigInt.toString() : rawLogAllowance;
      const active = currentBigInt !== undefined ? currentBigInt > 0n : safeBigInt(rawLogAllowance) > 0n;

      approvals.push({
        tokenAddress: log.address,
        spenderAddress,
        allowance: finalAllowance,
        approvalTransactionHash: log.transactionHash,
        approvalBlockNumber: quantityToNumber(log.blockNumber),
        active
      });
    }
    return approvals;
  }

  async getTokenBalance(address, tokenAddress) {
    const [raw, decimals, symbol] = await Promise.all([
      this.call(tokenAddress, '0x70a08231', paddedAddress(address)).catch(() => '0x0'),
      this.call(tokenAddress, '0x313ce567', '').catch(() => '0x12'),
      this.call(tokenAddress, '0x95d89b41', '').then(decodeString).catch(() => undefined)
    ]);
    return {
      raw: safeBigInt(raw).toString(),
      decimals: quantityToNumber(decimals) ?? 18,
      symbol
    };
  }

  async call(to, selector, data) {
    return this.rpc('eth_call', [{ to, data: `${selector}${data}` }, 'latest']);
  }

  async getNativeBalance(address) {
    const wei = await this.rpc('eth_getBalance', [address, 'latest']).catch(() => '0x0');
    return safeBigInt(wei).toString();
  }

  /** EIP-7702 (Pectra): extract the delegated target from a designator code. */
  async getEip7702Delegate(address) {
    try {
      const code = await this.rpc('eth_getCode', [address, 'latest']);
      const hex = typeof code === 'string' ? code.toLowerCase().replace(/^0x/, '') : '';
      if (!hex.startsWith(EIP7702_DELEGATION_PREFIX) || hex.length !== 46) return undefined;
      const delegatedTo = `0x${hex.slice(6, 46)}`;
      const targetCode = await this.rpc('eth_getCode', [delegatedTo, 'latest']).catch(() => '0x');
      const isContract = Boolean(targetCode && targetCode !== '0x');
      return { delegatedTo, delegatedToIsContract: isContract, delegatedToCodeSizeBytes: isContract ? (targetCode.length - 2) / 2 : 0 };
    } catch {
      return undefined;
    }
  }

  async getContractMetadata(address) {
    const owner = await this.getOwner(address).catch(() => null);
    const proxy = await this.getProxyImplementation(address).catch(() => null);
    if (!owner && !proxy) return null;
    return { contractAddress: address, owner: owner?.owner, admin: proxy?.adminAddress, upgradeFunctions: proxy ? ['upgradeTo'] : [], dependencies: [] };
  }

  async getLogs(address) {
    const logs = await this.getLogsInRanges({ address });
    return logs.map((log) => ({ transactionHash: log.transactionHash, blockNumber: quantityToNumber(log.blockNumber), contractAddress: address, event: 'LOG', topics: log.topics, data: log.data }));
  }

  async getLogsInRanges(filter = {}) {
    const latestHex = await this.rpc('eth_blockNumber', []);
    const latest = quantityToNumber(latestHex);
    if (latest === undefined) throw new Error('RPC returned an invalid latest block number');

    let startBlock;
    if (filter.fromBlock !== undefined && filter.fromBlock !== null) {
      startBlock = typeof filter.fromBlock === 'string' && filter.fromBlock.startsWith('0x')
        ? quantityToNumber(filter.fromBlock) ?? 0
        : Number(filter.fromBlock);
    } else if (this.approvalFromBlock !== undefined) {
      startBlock = Number(this.approvalFromBlock);
    } else {
      startBlock = Math.max(0, latest - (this.approvalBlockRange || 10000));
    }

    let targetToBlock = latest;
    if (filter.toBlock !== undefined && filter.toBlock !== null) {
      targetToBlock = typeof filter.toBlock === 'string' && filter.toBlock.startsWith('0x')
        ? quantityToNumber(filter.toBlock) ?? latest
        : Number(filter.toBlock);
    }

    const logs = [];
    let currentChunkSize = Math.max(1, this.logBlockRange || 10000);
    let fromBlock = Math.max(0, startBlock);
    let chunksQueried = 0;
    const maxChunks = this.maxLogChunks || 20;

    while (fromBlock <= targetToBlock && chunksQueried < maxChunks) {
      const toBlock = Math.min(fromBlock + currentChunkSize, targetToBlock);
      try {
        const queryFilter = {
          ...filter,
          fromBlock: `0x${fromBlock.toString(16)}`,
          toBlock: `0x${toBlock.toString(16)}`
        };
        const result = await this.rpc('eth_getLogs', [queryFilter]);
        if (Array.isArray(result)) {
          logs.push(...result);
        }
        chunksQueried += 1;
        fromBlock = toBlock + 1;
      } catch (error) {
        const isRangeError = /range|limit|more than|exceed|query returned/i.test(error.message) ||
          error.code === -32005 || error.code === -32600;
        if (isRangeError && currentChunkSize > 50) {
          currentChunkSize = Math.max(50, Math.floor(currentChunkSize / 4));
          continue;
        }
        break;
      }
    }

    return logs;
  }

  async getOwner(address) {
    try {
      const ownerWord = await this.call(address, '0x8da5cb5b', '');
      const owner = addressFromWord(ownerWord);
      return owner ? { owner } : null;
    } catch {
      return null;
    }
  }

  async getProxyImplementation(address) {
    try {
      const [implWord, adminWord] = await Promise.all([
        this.rpc('eth_getStorageAt', [address, IMPLEMENTATION_SLOT, 'latest']).catch(() => null),
        this.rpc('eth_getStorageAt', [address, ADMIN_SLOT, 'latest']).catch(() => null)
      ]);
      const implementationAddress = addressFromWord(implWord);
      const adminAddress = addressFromWord(adminWord);
      if (!implementationAddress && !adminAddress) return null;
      return { implementationAddress, adminAddress, slot: 'eip1967.proxy.implementation' };
    } catch {
      return null;
    }
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

  async getAddressType(address, chain) {
    if (this.rpcProvider?.getAddressType) return this.rpcProvider.getAddressType(address, chain);
    if (this.indexer?.getAddressType) return this.indexer.getAddressType(address, chain);
    return 'UNKNOWN';
  }
  async getTransactions(address, chain) {
    if (this.indexer?.getTransactions) return this.indexer.getTransactions(address, chain);
    return [];
  }
  async getTokenApprovals(address, chain) {
    if (this.rpcProvider?.getTokenApprovals) return this.rpcProvider.getTokenApprovals(address, chain);
    return [];
  }
  async getTokenBalance(address, tokenAddress, chain) {
    if (this.rpcProvider?.getTokenBalance) return this.rpcProvider.getTokenBalance(address, tokenAddress, chain);
    return { raw: '0', decimals: 18, symbol: undefined };
  }
  async getContractMetadata(address, chain) {
    const [indexed, direct] = await Promise.all([
      this.indexer?.getContractMetadata ? this.indexer.getContractMetadata(address, chain).catch(() => null) : null,
      this.rpcProvider?.getContractMetadata ? this.rpcProvider.getContractMetadata(address, chain).catch(() => null) : null
    ]);
    return indexed || direct || null;
  }
  async getLogs(address, chain) {
    if (this.indexer?.getLogs) return this.indexer.getLogs(address, chain);
    if (this.rpcProvider?.getLogs) return this.rpcProvider.getLogs(address, chain);
    return [];
  }
  async getOwner(address, chain) {
    if (this.rpcProvider?.getOwner) return this.rpcProvider.getOwner(address, chain);
    return null;
  }
  async getProxyImplementation(address, chain) {
    if (this.rpcProvider?.getProxyImplementation) return this.rpcProvider.getProxyImplementation(address, chain);
    return null;
  }
  async getNativeBalance(address, chain) {
    if (this.rpcProvider?.getNativeBalance) return this.rpcProvider.getNativeBalance(address, chain);
    return '0';
  }
  async getEip7702Delegate(address, chain) {
    if (this.rpcProvider?.getEip7702Delegate) return this.rpcProvider.getEip7702Delegate(address, chain);
    return undefined;
  }
  async getAddressMetadata(address, chain) {
    return this.indexer?.getAddressMetadata ? this.indexer.getAddressMetadata(address, chain).catch(() => null) : null;
  }
}

module.exports = { RpcBlockchainProvider, CompositeBlockchainProvider, APPROVAL_TOPIC, IMPLEMENTATION_SLOT, ADMIN_SLOT, safeBigInt };