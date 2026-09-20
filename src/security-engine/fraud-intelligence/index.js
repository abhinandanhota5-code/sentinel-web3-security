const types = require('./types');
const provider = require('./provider');
const { EntityResolutionEngine } = require('./entity-resolution');
const { propagateNetworkRisk } = require('./network-propagation');
const { I4C_ENTITIES, I4C_RESOLUTION_BRIDGES, I4C_PROVENANCE } = require('./i4c-dataset');
const { OFAC_ENTITIES, OFAC_PROVENANCE } = require('./ofac-dataset');

module.exports = {
  ...types,
  ...provider,
  EntityResolutionEngine,
  propagateNetworkRisk,
  I4C_ENTITIES,
  I4C_RESOLUTION_BRIDGES,
  I4C_PROVENANCE,
  OFAC_ENTITIES,
  OFAC_PROVENANCE
};
