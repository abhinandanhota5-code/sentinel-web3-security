const STATUSES = Object.freeze(['OBSERVED', 'EXTERNAL', 'INFERRED', 'UNKNOWN']);
const SEVERITIES = Object.freeze(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO', 'UNKNOWN']);

function finding({ findingType, status, severity = 'INFO', entity, chain, evidence = {}, explanationInputs = {}, limitations = [] }) {
  if (!STATUSES.includes(status)) throw new Error(`Invalid evidence status: ${status}`);
  if (!SEVERITIES.includes(severity)) throw new Error(`Invalid severity: ${severity}`);
  return { findingType, status, severity, entity, chain, evidence, explanationInputs, limitations };
}

function unknownFinding({ findingType, entity, chain, limitations, explanationInputs = {} }) {
  return finding({ findingType, status: 'UNKNOWN', severity: 'UNKNOWN', entity, chain, limitations, explanationInputs });
}

module.exports = { STATUSES, SEVERITIES, finding, unknownFinding };