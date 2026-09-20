    1	class BlockchainProvider {
    2	  async getAddressType() {
    3	    throw new Error('BlockchainProvider.getAddressType() must be implemented');
    4	  }
    5	
    6	  async getTransactions() {
    7	    throw new Error('BlockchainProvider.getTransactions() must be implemented');
    8	  }
    9	
   10	  async getTokenApprovals() {
   11	    throw new Error('BlockchainProvider.getTokenApprovals() must be implemented');
   12	  }
   13	
   14	  async getTokenBalance() {
   15	    throw new Error('BlockchainProvider.getTokenBalance() must be implemented');
   16	  }
   17	
   18	  async getContractMetadata() {
   19	    throw new Error('BlockchainProvider.getContractMetadata() must be implemented');
   20	  }
   21	
   22	  async getLogs() {
   23	    throw new Error('BlockchainProvider.getLogs() must be implemented');
   24	  }
   25	
   26	  async getOwner() {
   27	    throw new Error('BlockchainProvider.getOwner() must be implemented');
   28	  }
   29	
   30	  async getProxyImplementation() {
   31	    throw new Error('BlockchainProvider.getProxyImplementation() must be implemented');
   32	  }
   33	
   34	  /**
   35	   * Fetches metadata for an address, such as labels, reputation, and warnings.
   36	   * Returns null if no metadata is found or an error occurs.
   37	   */
   38	  async getAddressMetadata() {
   39	    throw new Error('BlockchainProvider.getAddressMetadata() must be implemented');
   40	  }
   41	}
   42	
   43	module.exports = { BlockchainProvider };