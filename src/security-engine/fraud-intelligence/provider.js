/**
 * Fraud Intelligence Providers.
 *
 * Provides a vendor-agnostic interface for querying government and public
 * fraud-intelligence registries without tight coupling to specific database transports.
 */

const { I4C_ENTITIES, I4C_RESOLUTION_BRIDGES } = require('./i4c-dataset');
const { OFAC_ENTITIES } = require('./ofac-dataset');

class FraudIntelligenceProvider {
  /**
   * Returns all known external risk entities.
   * @returns {Promise<Array>}
   */
  async getRiskEntities() {
    throw new Error('getRiskEntities() must be implemented by subclass');
  }

  /**
   * Resolves entities matching a specific identifier string.
   * @param {string} identifier
   * @returns {Promise<Array>}
   */
  async findEntitiesByIdentifier(identifier) {
    if (!identifier) return [];
    const normalized = identifier.toLowerCase().trim();
    const all = await this.getRiskEntities();
    return all.filter((e) => e.identifier.toLowerCase() === normalized);
  }

  /**
   * Returns known resolution bridges linking off-chain identifiers to EVM addresses.
   * @returns {Promise<Array>}
   */
  async getResolutionBridges() {
    return [];
  }
}

class I4cFraudIntelligenceProvider extends FraudIntelligenceProvider {
  constructor(options = {}) {
    super();
    this.name = 'i4c_ncrp';
    this.customEntities = options.entities || null;
    this.customBridges = options.bridges || null;
  }

  async getRiskEntities() {
    return this.customEntities || I4C_ENTITIES;
  }

  async getResolutionBridges() {
    return this.customBridges || I4C_RESOLUTION_BRIDGES;
  }
}

class OfacFraudIntelligenceProvider extends FraudIntelligenceProvider {
  constructor(options = {}) {
    super();
    this.name = 'ofac_sdn';
    this.customEntities = options.entities || null;
  }

  async getRiskEntities() {
    return this.customEntities || OFAC_ENTITIES;
  }

  async getResolutionBridges() {
    return [];
  }
}

class CompositeFraudIntelligenceProvider extends FraudIntelligenceProvider {
  constructor(providers = []) {
    super();
    this.providers = providers;
  }

  async getRiskEntities() {
    const lists = await Promise.all(this.providers.map((p) => p.getRiskEntities()));
    return lists.flat();
  }

  async getResolutionBridges() {
    const bridges = await Promise.all(this.providers.map((p) => p.getResolutionBridges()));
    return bridges.flat();
  }
}

function createDefaultFraudIntelligenceProvider(options = {}) {
  return new CompositeFraudIntelligenceProvider([
    new I4cFraudIntelligenceProvider(options.i4c),
    new OfacFraudIntelligenceProvider(options.ofac)
  ]);
}

module.exports = {
  FraudIntelligenceProvider,
  I4cFraudIntelligenceProvider,
  OfacFraudIntelligenceProvider,
  CompositeFraudIntelligenceProvider,
  createDefaultFraudIntelligenceProvider
};
