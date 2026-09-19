const { BlockchainProvider } = require('./provider');

const ADDRESSES = Object.freeze({
  wallet: '0x1111111111111111111111111111111111111111',
  token: '0x2222222222222222222222222222222222222222',
  spender: '0x3333333333333333333333333333333333333333',
  protocol: '0x4444444444444444444444444444444444444444',
  implementation: '0x5555555555555555555555555555555555555555',
  admin: '0x6666666666666666666666666666666666666666'
});

class DemoBlockchainProvider extends BlockchainProvider {
  constructor() {
    super();
    this.mode = 'DEMO';
  }

  async getAddressType(address) {
    const normalized = address.toLowerCase();
    if (normalized === ADDRESSES.wallet) return 'EOA';
    if ([ADDRESSES.token, ADDRESSES.spender, ADDRESSES.protocol, ADDRESSES.implementation].includes(normalized)) return 'SMART_CONTRACT';
    return 'UNKNOWN';
  }

  async getTransactions(address) {
    if (address.toLowerCase() !== ADDRESSES.wallet) return [];
    return [
      { hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', blockNumber: 190, timestamp: '2026-01-02T00:00:00Z', from: ADDRESSES.wallet, to: ADDRESSES.spender, kind: 'CONTRACT_INTERACTION' },
      { hash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', blockNumber: 240, timestamp: '2026-02-02T00:00:00Z', from: ADDRESSES.wallet, to: ADDRESSES.token, kind: 'TOKEN_TRANSFER' }
    ];
  }

  async getTokenApprovals(address) {
    if (address.toLowerCase() !== ADDRESSES.wallet) return [];
    return [{ tokenAddress: ADDRESSES.token, spenderAddress: ADDRESSES.spender, allowance: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', approvalTransactionHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', approvalBlockNumber: 190, active: true }];
  }

  async getTokenBalance(address, tokenAddress) {
    if (address.toLowerCase() === ADDRESSES.wallet && tokenAddress.toLowerCase() === ADDRESSES.token) return { raw: '1250000000000000000', decimals: 18, symbol: 'DEMO' };
    return { raw: '0', decimals: 18, symbol: 'UNKNOWN' };
  }

  async getContractMetadata(address) {
    if (address.toLowerCase() !== ADDRESSES.protocol) return null;
    return { contractAddress: ADDRESSES.protocol, owner: ADDRESSES.admin, admin: ADDRESSES.admin, pause: true, mint: true, burn: false, withdraw: true, feeControls: true, upgradeFunctions: ['upgradeTo'], timelock: false, ownershipTransfer: true, dependencies: [ADDRESSES.token] };
  }

  async getLogs(address) {
    if (address.toLowerCase() !== ADDRESSES.protocol) return [];
    return [{ transactionHash: '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', blockNumber: 300, event: 'UPGRADE', contractAddress: ADDRESSES.protocol }];
  }

  async getOwner(address) {
    if (address.toLowerCase() === ADDRESSES.protocol) return { owner: ADDRESSES.admin, blockNumber: 100 };
    return null;
  }

  async getProxyImplementation(address) {
    if (address.toLowerCase() === ADDRESSES.protocol) return { implementationAddress: ADDRESSES.implementation, adminAddress: ADDRESSES.admin, slot: 'eip1967.proxy.implementation' };
    return null;
  }
}

module.exports = { DemoBlockchainProvider, ADDRESSES };