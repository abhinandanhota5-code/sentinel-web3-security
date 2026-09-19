/**
 * Evidence primitives for Sentinel.
 *
 * The deterministic blockchain/security engine is the source of truth.
 * These types are the *only* sanctioned contract between the deterministic
 * layer and the AI layer: the AI layer must never accept bare strings for
 * on-chain facts, so everything is strongly typed.
 */

import type { KnowledgeType } from "./knowledge.js";

/** Stable, unique identifier for a single piece of evidence. */
export type EvidenceId = string;

/** Machine-readable classification of a finding produced by the engine. */
export type FindingSeverity = "info" | "low" | "medium" | "high" | "critical";

/** Chain identifier as used by the deterministic engine (e.g. "eip155:1"). */
export type ChainId = string;

/** EVM address, hex-encoded. Kept opaque: validation lives in the engine. */
export type Address = string;

/** 32-byte hash (tx hash, role hash), hex-encoded. */
export type Hash32 = string;

/** What kind of on-chain fact this record represents. */
export type EvidenceKind =
  | "transaction"
  | "contract"
  | "token"
  | "approval"
  | "role"
  | "proxy"
  | "balance"
  | "protocol"
  | "fund_flow";

/** Provenance of a fact: which deterministic component produced it. */
export interface EvidenceSource {
  /** Deterministic component that produced the fact, e.g. "rpc-eth-get-storage-at". */
  tool: string;
  /** Version of that component, for reproducibility. */
  version?: string;
  /** Where the data came from (e.g. RPC endpoint identifier). */
  locator?: string;
}

/** Base field every evidence record shares. */
export interface EvidenceBase {
  id: EvidenceId;
  kind: EvidenceKind;
  /** Chain the fact was observed on. */
  chain: ChainId;
  source: EvidenceSource;
  /** UTC ISO-8601 timestamp at which the fact was captured. */
  capturedAt: string;
}

/** An on-chain transaction the engine has canonicalized. */
export interface TransactionEvidence extends EvidenceBase {
  kind: "transaction";
  hash: Hash32;
  from: Address;
  to?: Address;
  blockNumber: number;
  /** UTC ISO-8601 block timestamp as reported by the node. */
  timestamp?: string;
  valueWei: string;
  input: string;
  status: "success" | "failed" | "unknown";
}

/** Static facts about a contract. */
export interface ContractEvidence extends EvidenceBase {
  kind: "contract";
  address: Address;
  deployed: boolean;
  hasCode: boolean;
  isProxy: boolean;
  /** Implementation address if `isProxy` and it was resolved on-chain. */
  implementation?: Address;
  verifiedSource: boolean;
  /** Compiler/version metadata when the engine has it. */
  compiler?: string;
}

/** Token metadata as read from the chain by the engine. */
export interface TokenEvidence extends EvidenceBase {
  kind: "token";
  address: Address;
  symbol?: string;
  decimals?: number;
  standard: "erc20" | "erc721" | "erc1155" | "other";
}

/** An ERC-20 `approve`/`increaseAllowance`-style grant. */
export interface ApprovalEvidence extends EvidenceBase {
  kind: "approval";
  token: Address;
  owner: Address;
  spender: Address;
  /** Raw allowance as a decimal string; `unlimited` is set only when the engine resolved the sentinel value. */
  amount: string;
  unlimited: boolean;
  txHash: Hash32;
}

/** A role grant (e.g. AccessControl DEFAULT_ADMIN_ROLE, Ownable owner). */
export interface RoleEvidence extends EvidenceBase {
  kind: "role";
  contract: Address;
  roleHash: Hash32;
  /** Human-readable role name only when the engine derived it from verified source. */
  roleName?: string;
  holder: Address;
  granted: boolean;
}

/** A token balance as of a specific block. */
export interface BalanceEvidence extends EvidenceBase {
  kind: "balance";
  token: Address;
  account: Address;
  /** Raw balance as a decimal string (uint256-safe). */
  amount: string;
  /** Block number at which the balance was read. */
  blockNumber: number;
}

/** Protocol-level attribution produced by the engine. */
export interface ProtocolEvidence extends EvidenceBase {
  kind: "protocol";
  name: string;
  /** Addresses the engine attributes to the protocol. */
  contracts: Address[];
  adminRoleHashes: Hash32[];
}

/** Directed value movement the engine resolved on-chain. */
export interface FundFlowEvidence extends EvidenceBase {
  kind: "fund_flow";
  from: Address;
  to: Address;
  token?: Address;
  amount: string;
  txHash: Hash32;
}

export type Evidence =
  | TransactionEvidence
  | ContractEvidence
  | TokenEvidence
  | ApprovalEvidence
  | RoleEvidence
  | BalanceEvidence
  | ProtocolEvidence
  | FundFlowEvidence;

/**
 * An evidence record as handed to the AI layer: the on-chain fact plus the
 * epistemic label describing how the fact was established.
 */
export type EvidenceRecord = Evidence & { knowledgeType: KnowledgeType };

/** The complete, self-contained evidence context for one explanation request. */
export interface EvidenceBundle {
  subject: { chain: ChainId; address?: Address; txHash?: Hash32 };
  /** UTC ISO-8601 time the bundle was assembled. */
  assembledAt: string;
  records: EvidenceRecord[];
  /** Deterministic engine version, for audit trails. */
  engineVersion: string;
}

const ISO_8601_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const HEX_40 = /^0x[0-9a-fA-F]{40}$/;
const HEX_64 = /^0x[0-9a-fA-F]{64}$/;
const DECIMAL_STRING = /^\d+$/;

export class EvidenceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvidenceValidationError";
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new EvidenceValidationError(message);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function assertAddress(v: unknown, field: string): void {
  assert(typeof v === "string" && HEX_40.test(v), `${field} must be a hex address`);
}

function assertHash32(v: unknown, field: string): void {
  assert(typeof v === "string" && HEX_64.test(v), `${field} must be a 32-byte hex hash`);
}

function assertTimestamp(v: unknown, field: string): void {
  assert(
    typeof v === "string" && ISO_8601_UTC.test(v) && !Number.isNaN(Date.parse(v)),
    `${field} must be a UTC ISO-8601 timestamp`,
  );
}

function assertDecimalString(v: unknown, field: string): void {
  assert(typeof v === "string" && DECIMAL_STRING.test(v), `${field} must be a decimal string`);
}

function assertBase(v: Record<string, unknown>, kind: EvidenceKind): void {
  assert(typeof v.id === "string" && v.id.length > 0, "id must be a non-empty string");
  assert(v.kind === kind, `kind must be "${kind}"`);
  assert(typeof v.chain === "string" && v.chain.length > 0, "chain must be a non-empty string");
  assert(isObject(v.source) && typeof v.source.tool === "string" && v.source.tool.length > 0, "source.tool is required");
  assertTimestamp(v.capturedAt, "capturedAt");
}

function assertOptionalString(v: Record<string, unknown>, field: string): void {
  if (v[field] !== undefined) assert(typeof v[field] === "string", `${field} must be a string when present`);
}

/**
 * Validate one untrusted record and attach its epistemic label.
 * Throws {@link EvidenceValidationError} on any structural violation so that
 * malformed "evidence" can never reach the prompt or the user.
 */
export function parseEvidenceRecord(raw: unknown): EvidenceRecord {
  assert(isObject(raw), "evidence record must be an object");
  const v = raw;
  const kind = v.kind as EvidenceKind;

  switch (kind) {
    case "transaction": {
      assertBase(v, kind);
      assertHash32(v.hash, "hash");
      assertAddress(v.from, "from");
      if (v.to !== undefined) assertAddress(v.to, "to");
      assert(typeof v.blockNumber === "number" && Number.isInteger(v.blockNumber) && v.blockNumber >= 0, "blockNumber must be a non-negative integer");
      if (v.timestamp !== undefined) assertTimestamp(v.timestamp, "timestamp");
      assertDecimalString(v.valueWei, "valueWei");
      assert(typeof v.input === "string", "input must be a string");
      assert(v.status === "success" || v.status === "failed" || v.status === "unknown", "status must be success|failed|unknown");
      assert(typeof v.knowledgeType === "string", "knowledgeType is required");
      return v as unknown as EvidenceRecord;
    }
    case "contract": {
      assertBase(v, kind);
      assertAddress(v.address, "address");
      assert(typeof v.deployed === "boolean", "deployed must be boolean");
      assert(typeof v.hasCode === "boolean", "hasCode must be boolean");
      assert(typeof v.isProxy === "boolean", "isProxy must be boolean");
      if (v.implementation !== undefined) assertAddress(v.implementation, "implementation");
      assert(typeof v.verifiedSource === "boolean", "verifiedSource must be boolean");
      assertOptionalString(v, "compiler");
      assert(typeof v.knowledgeType === "string", "knowledgeType is required");
      return v as unknown as EvidenceRecord;
    }
    case "token": {
      assertBase(v, kind);
      assertAddress(v.address, "address");
      assertOptionalString(v, "symbol");
      if (v.decimals !== undefined) assert(typeof v.decimals === "number" && Number.isInteger(v.decimals), "decimals must be an integer");
      assert(v.standard === "erc20" || v.standard === "erc721" || v.standard === "erc1155" || v.standard === "other", "invalid token standard");
      assert(typeof v.knowledgeType === "string", "knowledgeType is required");
      return v as unknown as EvidenceRecord;
    }
    case "approval": {
      assertBase(v, kind);
      assertAddress(v.token, "token");
      assertAddress(v.owner, "owner");
      assertAddress(v.spender, "spender");
      assertDecimalString(v.amount, "amount");
      assert(typeof v.unlimited === "boolean", "unlimited must be boolean");
      assertHash32(v.txHash, "txHash");
      assert(typeof v.knowledgeType === "string", "knowledgeType is required");
      return v as unknown as EvidenceRecord;
    }
    case "role": {
      assertBase(v, kind);
      assertAddress(v.contract, "contract");
      assertHash32(v.roleHash, "roleHash");
      assertOptionalString(v, "roleName");
      assertAddress(v.holder, "holder");
      assert(typeof v.granted === "boolean", "granted must be boolean");
      assert(typeof v.knowledgeType === "string", "knowledgeType is required");
      return v as unknown as EvidenceRecord;
    }
    case "balance": {
      assertBase(v, kind);
      assertAddress(v.token, "token");
      assertAddress(v.account, "account");
      assertDecimalString(v.amount, "amount");
      assert(typeof v.blockNumber === "number" && Number.isInteger(v.blockNumber) && v.blockNumber >= 0, "blockNumber must be a non-negative integer");
      assert(typeof v.knowledgeType === "string", "knowledgeType is required");
      return v as unknown as EvidenceRecord;
    }
    case "protocol": {
      assertBase(v, kind);
      assert(typeof v.name === "string" && v.name.length > 0, "name must be a non-empty string");
      assert(Array.isArray(v.contracts), "contracts must be an array");
      for (const c of v.contracts as unknown[]) assertAddress(c, "contracts[]");
      assert(Array.isArray(v.adminRoleHashes), "adminRoleHashes must be an array");
      for (const h of v.adminRoleHashes as unknown[]) assertHash32(h, "adminRoleHashes[]");
      assert(typeof v.knowledgeType === "string", "knowledgeType is required");
      return v as unknown as EvidenceRecord;
    }
    case "fund_flow": {
      assertBase(v, kind);
      assertAddress(v.from, "from");
      assertAddress(v.to, "to");
      if (v.token !== undefined) assertAddress(v.token, "token");
      assertDecimalString(v.amount, "amount");
      assertHash32(v.txHash, "txHash");
      assert(typeof v.knowledgeType === "string", "knowledgeType is required");
      return v as unknown as EvidenceRecord;
    }
    default:
      throw new EvidenceValidationError(`unknown evidence kind: ${String(kind)}`);
  }
}

/**
 * Validate a full bundle. Enforces the epistemic invariant: any record that
 * merely quotes secondary material must be labeled INFERRED, and any record
 * the engine could not establish must not be present at all (absence is
 * represented as UNKNOWN at the explanation layer, not as fake evidence).
 */
export function parseEvidenceBundle(raw: unknown): EvidenceBundle {
  assert(isObject(raw), "evidence bundle must be an object");
  const subject = raw.subject;
  assert(isObject(subject), "subject must be an object");
  assert(typeof subject.chain === "string" && subject.chain.length > 0, "subject.chain is required");
  if (subject.address !== undefined) assertAddress(subject.address, "subject.address");
  if (subject.txHash !== undefined) assertHash32(subject.txHash, "subject.txHash");
  assertTimestamp(raw.assembledAt, "assembledAt");
  assert(typeof raw.engineVersion === "string" && raw.engineVersion.length > 0, "engineVersion is required");
  assert(Array.isArray(raw.records), "records must be an array");

  const records = (raw.records as unknown[]).map(parseEvidenceRecord);
  for (const r of records) {
    if (r.knowledgeType === "INFERRED") {
      const tool = r.source.tool.toLowerCase();
      const ruleBasis = r.source.locator?.startsWith("rule:") ?? false;
      assert(
        tool.includes("infer") || ruleBasis,
        "INFERRED records must cite an inference basis in source.tool or a rule: locator",
      );
    }
  }

  return {
    subject: subject as EvidenceBundle["subject"],
    assembledAt: raw.assembledAt as string,
    records,
    engineVersion: raw.engineVersion as string,
  };
}
