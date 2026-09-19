class BlockchainProvider {
  async getAddressType() {
    throw new Error('BlockchainProvider.getAddressType() must be implemented');
  }

  async getTransactions() {
    throw new Error('BlockchainProvider.getTransactions() must be implemented');
  }

  async getTokenApprovals() {
    throw new Error('BlockchainProvider.getTokenApprovals() must be implemented');
  }

  async getTokenBalance() {
    throw new Error('BlockchainProvider.getTokenBalance() must be implemented');
  }

  async getContractMetadata() {
    throw new Error('BlockchainProvider.getContractMetadata() must be implemented');
  }

  async getLogs() {
    throw new Error('BlockchainProvider.getLogs() must be implemented');
  }

  async getOwner() {
    throw new Error('BlockchainProvider.getOwner() must be implemented');
  }

  async getProxyImplementation() {
    throw new Error('BlockchainProvider.getProxyImplementation() must be implemented');
  }
}

module.exports = { BlockchainProvider };