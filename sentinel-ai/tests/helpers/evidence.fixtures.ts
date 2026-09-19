/**
 * Shared evidence fixtures for the test suite.
 * Values are synthetic; they never represent real on-chain data.
 */

import { parseEvidenceBundle, type EvidenceBundle } from "../../dist/evidence.js";

export const ADDR_A = "0x1111111111111111111111111111111111111111";
export const ADDR_B = "0x2222222222222222222222222222222222222222";
export const ADDR_C = "0x3333333333333333333333333333333333333333";
export const TX = `0x${"ab".repeat(32)}`;
export const ROLE = `0x${"00".repeat(32)}`;

export function baseRecord(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    id: "ev-1",
    kind: "approval",
    chain: "eip155:1",
    source: { tool: "rpc-eth-call", version: "1.0.0", locator: "alchemy-mainnet" },
    capturedAt: "2026-09-19T10:00:00Z",
    knowledgeType: "OBSERVED",
    ...overrides,
  };
}

export function bundleWith(records: Record<string, unknown>[]): EvidenceBundle {
  return parseEvidenceBundle({
    subject: { chain: "eip155:1", address: ADDR_A },
    assembledAt: "2026-09-19T10:00:01Z",
    engineVersion: "engine-1.0.0",
    records,
  });
}

export function goodBundle(): EvidenceBundle {
  return bundleWith([
    baseRecord({
      id: "ev-approve-1",
      token: ADDR_B,
      owner: ADDR_A,
      spender: ADDR_C,
      amount: "999999999999999999000",
      unlimited: false,
      txHash: TX,
    }),
  ]);
}
