    1	const { BlockchainProvider } = require('./provider');
    2	
    3	const APPROVAL_TOPIC = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925';
    4	const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
    6	const ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';
    7	
    8	function paddedAddress(address) {
    9	  return address.toLowerCase().replace(/^0x/, '').padStart(64, '0');
   10	}
   11	
   12	function addressFromWord(word) {
   13	  if (!word || /^0x?0+$/.test(word)) return undefined;
   14	  return `0x${word.replace(/^0x/, '').slice(-40)}`;
   15	}
   16	
   17	// EIP-7702 (Pectra): EOAs can delegate code. 0xef0100 || address is a
   18	// delegation designator, not contract bytecode — the address remains an EOA.
   19	// Shape: "0x" + 3-byte magic (6 hex) + 20-byte address (40 hex) = 48 chars.
   20	const EIP7702_DELEGATION_PREFIX = 'ef0100';
   21	
   22	function isDelegationDesignator(code) {
   23	  if (typeof code !== 'string') return false;
   24	  const hex = code.toLowerCase().replace(/^0x/, '');
   25	  return hex.startsWith(EIP7702_DELEGATION_PREFIX) && hex.length === 46;
   26	}
   27	
   28	function quantityToNumber(value) {
   29	  const number = Number.parseInt(value, 16);
   30	  return Number.isFinite(number) ? number : undefined;
   31	}
   32	
   33	function decodeString(value) {
   34	  if (!value || value === '0x') return undefined;
   35	  const hex = value.replace(/^0x/, '');
   36	  try {
   37	    const offset = Number.parseInt(hex.slice(0, 64), 16) * 2;
   38	    const length = Number.parseInt(hex.slice(offset, offset + 64), 16) * 2;
   39	    return Buffer.from(hex.slice(offset + 64, offset + 64 + length), 'hex').toString('utf8') || undefined;
   40	  } catch {
   41	    return undefined;
   42	  }
   43	}
   44	
   45	class RpcBlockchainProvider extends BlockchainProvider {
   46	  constructor({ rpcUrl, fetchImpl = globalThis.fetch, mode = 'REAL', logBlockRange = 10000, approvalFromBlock = 0 } = {}) {
   47	    super();
   48	    if (!rpcUrl) throw new Error('ETHEREUM_RPC_URL is required for the RPC provider');
   49	    if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required');
   50	    this.mode = mode;
   51	    this.rpcUrl = rpcUrl;
   52	    this.fetchImpl = fetchImpl;
   53	    this.logBlockRange = logBlockRange;
   54	    this.approvalFromBlock = approvalFromBlock;
   55	  }
   56	
   57	  async rpc(method, params) {
   58	    let response;
   59	    try {
   60	      response = await this.fetchImpl(this.rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
   61	    } catch (error) {
   62	      throw new Error(`RPC request failed: ${error.message}`);
   63	    }
   64	    if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
   65	    const payload = await response.json();
   66	    if (payload.error) throw new Error(`RPC ${method} failed: ${payload.error.message || payload.error.code}`);
   67	    return payload.result;
   68	  }
   69	
   70	  async getAddressType(address) {
   71	    const code = await this.rpc('eth_getCode', [address, 'latest']);
   72	    if (code === '0x') return 'EOA';
   73	    if (code && !isDelegationDesignator(code)) return 'SMART_CONTRACT';
   74	    if (code) return 'EOA';
   75	    return 'UNKNOWN';
   76	  }
   77	
   78	  async getTransactions() {
   79	    throw new Error('Transaction history requires the indexed provider');
   80	  }
   81	
   82	  async getTokenApprovals(address, chain) {
   83	    const logs = await this.getLogsInRanges({ fromBlock: this.approvalFromBlock, topics: [APPROVAL_TOPIC, `0x${paddedAddress(address)}`] });
   84	    const approvals = [];
   85	    for (const log of logs) {
   86	      const spenderAddress = addressFromWord(log.topics?.[2]);
   87	      if (!spenderAddress) continue;
   88	      const allowance = BigInt(log.data || '0x0').toString();
   89	      const current = await this.call(log.address, '0xdd62ed3e', `${paddedAddress(address)}${paddedAddress(spenderAddress)}`).catch(() => undefined);
   90	      approvals.push({ tokenAddress: log.address, spenderAddress, allowance: current ? BigInt(current).toString() : allowance, approvalTransactionHash: log.transactionHash, approvalBlockNumber: quantityToNumber(log.blockNumber), active: current ? BigInt(current) > 0n : allowance !== '0' });
   91	    }
   92	    return approvals;
   93	  }
   94	
   95	  async getTokenBalance(address, tokenAddress) {
   96	    const [raw, decimals, symbol] = await Promise.all([
   97	      this.call(tokenAddress, '0x70a08231', paddedAddress(address)),
   98	      this.call(tokenAddress, '0x313ce567', '').catch(() => '0x12'),
   99	      this.call(tokenAddress, '0x95d89b41', '').then(decodeString).catch(() => undefined)
  100	    ]);
  101	    return { raw: BigInt(raw).toString(), decimals: quantityToNumber(decimals) ?? 18, symbol };
  102	  }
  103	
  104	  async call(to, selector, data) {
  105	    return this.rpc('eth_call', [{ to, data: `${selector}${data}` }, 'latest']);
  106	  }
  107	
  108	  async getNativeBalance(address) {
  109	    const wei = await this.rpc('eth_getBalance', [address, 'latest']);
  110	    return BigInt(wei).toString();
  111	  }
  112	
  113	  /** EIP-7702 (Pectra): extract the delegated target from a designator code. */
  114	  async getEip7702Delegate(address) {
  115	    const code = await this.rpc('eth_getCode', [address, 'latest']);
  116	    const hex = typeof code === 'string' ? code.toLowerCase().replace(/^0x/, '') : '';
  117	    if (!hex.startsWith(EIP7702_DELEGATION_PREFIX) || hex.length !== 46) return undefined;
  118	    const delegatedTo = `0x${hex.slice(6, 46)}`;
  119	    const targetCode = await this.rpc('eth_getCode', [delegatedTo, 'latest']).catch(() => '0x');
  120	    const isContract = Boolean(targetCode && targetCode !== '0x');
  121	    return { delegatedTo, delegatedToIsContract: isContract, delegatedToCodeSizeBytes: isContract ? (targetCode.length - 2) / 2 : 0 };
  122	  }
  123	
  124	  async getContractMetadata(address) {
  125	    const owner = await this.getOwner(address).catch(() => null);
  126	    const proxy = await this.getProxyImplementation(address).catch(() => null);
  127	    if (!owner && !proxy) return null;
  128	    return { contractAddress: address, owner: owner?.owner, admin: proxy?.adminAddress, upgradeFunctions: proxy ? ['upgradeTo'] : [], dependencies: [] };
  129	  }
  130	
  131	  async getLogs(address) {
  132	    const logs = await this.getLogsInRanges({ address });
  133	    return logs.map((log) => ({ transactionHash: log.transactionHash, blockNumber: quantityToNumber(log.blockNumber), contractAddress: address, event: 'LOG', topics: log.topics, data: log.data }));
  134	  }
  135	
  136	  async getLogsInRanges(filter) {
  137	    const latest = quantityToNumber(await this.rpc('eth_blockNumber', []));
  138	    if (latest === undefined) throw new Error('RPC returned an invalid latest block number');
  139	    const logs = [];
  140	    for (let fromBlock = Number(filter.fromBlock || 0); fromBlock <= latest; fromBlock += this.logBlockRange + 1) {
  141	      const toBlock = Math.min(fromBlock + this.logBlockRange, latest);
  142	      const result = await this.rpc('eth_getLogs', [{ ...filter, fromBlock: `0x${fromBlock.toString(16)}`, toBlock: `0x${toBlock.toString(16)}` }]);
  143	      logs.push(...result);
  144	    }
  145	    return logs;
  146	  }
  147	
  148	  async getOwner(address) {
  149	    const owner = addressFromWord(await this.call(address, '0x8da5cb5b', ''));
  150	    return owner ? { owner } : null;
  151	  }
  152	
  153	  async getProxyImplementation(address) {
  154	    const implementationAddress = addressFromWord(await this.rpc('eth_getStorageAt', [address, IMPLEMENTATION_SLOT, 'latest']));
  155	    const adminAddress = addressFromWord(await this.rpc('eth_getStorageAt', [address, ADMIN_SLOT, 'latest']));
  156	    if (!implementationAddress && !adminAddress) return null;
  157	    return { implementationAddress, adminAddress, slot: 'eip1967.proxy.implementation' };
  158	  }
  159	}
  160	
  161	class CompositeBlockchainProvider extends BlockchainProvider {
  162	  constructor({ indexer, rpc } = {}) {
  163	    super();
  164	    if (!indexer && !rpc) throw new Error('An indexer or RPC provider is required');
  165	    this.mode = indexer?.mode && rpc?.mode && indexer.mode === rpc.mode ? indexer.mode : 'MIXED';
  166	    this.indexer = indexer;
  167	    this.rpcProvider = rpc;
  168	  }
  169	
  170	  async getAddressType(address, chain) { return this.rpcProvider ? this.rpcProvider.getAddressType(address, chain) : this.indexer.getAddressType(address, chain); }
  171	  async getTransactions(address, chain) { return this.indexer.getTransactions(address, chain); }
  172	  async getTokenApprovals(address, chain) { return this.rpcProvider.getTokenApprovals(address, chain); }
  173	  async getTokenBalance(address, tokenAddress, chain) { return this.rpcProvider.getTokenBalance(address, tokenAddress, chain); }
  174	  async getContractMetadata(address, chain) {
  175	    const [indexed, direct] = await Promise.all([this.indexer?.getContractMetadata(address, chain).catch(() => null), this.rpcProvider?.getContractMetadata(address, chain).catch(() => null)]);
  176	    return indexed || direct;
  177	  }
  178	  async getLogs(address, chain) { return this.indexer.getLogs(address, chain); }
  179	  async getOwner(address, chain) { return this.rpcProvider.getOwner(address, chain); }
  180	  async getProxyImplementation(address, chain) { return this.rpcProvider.getProxyImplementation(address, chain); }
  181	  async getNativeBalance(address, chain) { return this.rpcProvider.getNativeBalance(address, chain); }
  182	  async getEip7702Delegate(address, chain) { return this.rpcProvider.getEip7702Delegate(address, chain); }
  183	  // --- DELEGATING NEW METHOD ---
  184	  async getAddressMetadata(address, chain) {
  185	    // Delegate to the indexer (Etherscan provider) for address metadata.
  186	    return this.indexer?.getAddressMetadata(address, chain).catch(() => null);
  187	  }
  188	}
  189	
  190	module.exports = { RpcBlockchainProvider, CompositeBlockchainProvider, APPROVAL_TOPIC, IMPLEMENTATION_SLOT, ADMIN_SLOT };