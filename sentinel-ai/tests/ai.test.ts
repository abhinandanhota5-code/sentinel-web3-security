import { test } from "node:test";
import { strict as assert } from "node:assert";
import {
  parseEvidenceBundle,
  EvidenceValidationError,
  type EvidenceBundle,
  type EvidenceRecord,
} from "../dist/evidence.js";
import { SYSTEM_PROMPT, buildGroundedUserPrompt } from "../dist/prompt.js";
import { validateDraft, sanitizeDraft, groundedLiterals } from "../dist/validate.js";
import { EvidenceIndex, GroundedExplanationEngine, type ExplanationProvider, type PromptPair } from "../dist/engine.js";
import { evaluateExplanation, NullPrismClient, verdictFor } from "../dist/prism.js";

// ---------------------------------------------------------------- fixtures

const ADDR_A = "0x1111111111111111111111111111111111111111";
const ADDR_B = "0x2222222222222222222222222222222222222222";
const ADDR_C = "0x3333333333333333333333333333333333333333";
const TX = `0x${"ab".repeat(32)}`;
const ROLE = `0x${"00".repeat(32)}`;

function baseRecord(overrides: Record<string, unknown>): Record<string, unknown> {
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

function bundleWith(records: Record<string, unknown>[]): EvidenceBundle {
  return parseEvidenceBundle({
    subject: { chain: "eip155:1", address: ADDR_A },
    assembledAt: "2026-09-19T10:00:01Z",
    engineVersion: "engine-1.0.0",
    records,
  });
}

const goodBundle = () =>
  bundleWith([
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

// ---------------------------------------------------------------- evidence schema

void test("parses a valid evidence bundle", () => {
  const b = goodBundle();
  assert.equal(b.records.length, 1);
  assert.equal(b.records[0]!.kind, "approval");
  assert.equal(b.records[0]!.knowledgeType, "OBSERVED");
});

void test("rejects a record with a malformed address", () => {
  assert.throws(
    () =>
      bundleWith([
        baseRecord({ id: "ev-2", token: "0xnotanaddress", owner: ADDR_A, spender: ADDR_C, amount: "1", unlimited: false, txHash: TX }),
      ]),
    EvidenceValidationError,
  );
});

void test("rejects non-ISO timestamps", () => {
  assert.throws(
    () =>
      bundleWith([
        baseRecord({ id: "ev-3", token: ADDR_B, owner: ADDR_A, spender: ADDR_C, amount: "1", unlimited: false, txHash: TX, capturedAt: "yesterday" }),
      ]),
    EvidenceValidationError,
  );
});

void test("rejects unknown kinds", () => {
  assert.throws(
    () => bundleWith([baseRecord({ id: "ev-4", kind: "vibe" })]),
    EvidenceValidationError,
  );
});

void test("INFERRED records must state a basis", () => {
  const rec = baseRecord({
    id: "ev-5",
    knowledgeType: "INFERRED",
    token: ADDR_B, owner: ADDR_A, spender: ADDR_C, amount: "1", unlimited: false, txHash: TX,
    source: { tool: "deterministic-inference" },
  });
  const b = bundleWith([rec]);
  assert.equal(b.records[0]!.knowledgeType, "INFERRED");

  assert.throws(
    () =>
      bundleWith([
        baseRecord({ id: "ev-6", knowledgeType: "INFERRED", token: ADDR_B, owner: ADDR_A, spender: ADDR_C, amount: "1", unlimited: false, txHash: TX }),
      ]),
    EvidenceValidationError,
  );
});

// ---------------------------------------------------------------- prompt builder

void test("prompt renders numbered citations and subject", () => {
  const b = goodBundle();
  const p = buildGroundedUserPrompt({ bundle: b, question: "Explain this approval", audience: "analyst" });
  assert.match(p, /\[E0\] kind=approval/);
  assert.match(p, /knowledgeType=OBSERVED/);
  assert.match(p, /Explain this approval/);
});

void test("prompt renders unknown fields explicitly", () => {
  const p = buildGroundedUserPrompt({
    bundle: goodBundle(),
    question: "q",
    unknowns: [{ field: "token.symbol", reason: "no_evidence" }],
  });
  assert.match(p, /UNKNOWN FIELDS/);
  assert.match(p, /token\.symbol: UNKNOWN \(no_evidence\)/);
});

void test("prompt with zero records forces UNKNOWN posture", () => {
  const p = buildGroundedUserPrompt({
    bundle: bundleWith([]),
    question: "q",
  });
  assert.match(p, /no evidence records/);
  assert.match(p, /UNKNOWN/);
});

void test("system prompt forbids inventing on-chain facts", () => {
  for (const banned of ["transaction hashes", "contract addresses", "token balances", "permissions", "security incidents"]) {
    assert.match(SYSTEM_PROMPT, new RegExp(banned.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")));
  }
});

// ---------------------------------------------------------------- validator

void test("groundedLiterals collects bundle literals", () => {
  const literals = groundedLiterals(goodBundle());
  assert.ok(literals.has(ADDR_A));
  assert.ok(literals.has(TX));
  assert.ok(literals.has("999999999999999999000"));
});

void test("clean draft passes validation", () => {
  const b = goodBundle();
  const draft = `Owner ${ADDR_A} approved spender ${ADDR_C} on token ${ADDR_B} [E0]. The approval tx ${TX} was observed.`;
  const idx = new EvidenceIndex(b);
  const res = validateDraft(draft, b, idx.knowledgeMap());
  assert.equal(res.clean, true);
  assert.equal(res.unsupportedClaims.length, 0);
});

void test("invented address is flagged as unsupported claim", () => {
  const b = goodBundle();
  const invented = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
  const draft = `Also watch ${invented} [E0].`;
  const idx = new EvidenceIndex(b);
  const res = validateDraft(draft, b, idx.knowledgeMap());
  assert.equal(res.clean, false);
  assert.ok(res.unsupportedClaims.some((c) => c.literal === invented && c.type === "address"));
});

void test("invented tx hash and timestamp are flagged", () => {
  const b = goodBundle();
  const fakeTx = `0x${"cd".repeat(32)}`;
  const fakeTs = "2026-01-01T00:00:00Z";
  const draft = `Tx ${fakeTx} mined at ${fakeTs} [E0].`;
  const idx = new EvidenceIndex(b);
  const res = validateDraft(draft, b, idx.knowledgeMap());
  assert.ok(res.unsupportedClaims.some((c) => c.literal === fakeTx && c.type === "hash32"));
  assert.ok(res.unsupportedClaims.some((c) => c.literal === fakeTs && c.type === "timestamp"));
});

void test("invented citation ids are detected for stripping", () => {
  const b = goodBundle();
  const draft = `Approval exists [E0] and [E7].`;
  const idx = new EvidenceIndex(b);
  const res = validateDraft(draft, b, idx.knowledgeMap());
  assert.deepEqual(res.strippedCitations, ["[E7]"]);
});

void test("sanitize strips bad citations but keeps good ones", () => {
  const b = goodBundle();
  const draft = `Approval exists [E0] and [E7].`;
  const idx = new EvidenceIndex(b);
  const res = validateDraft(draft, b, idx.knowledgeMap());
  const out = sanitizeDraft(draft, res);
  assert.match(out.text, /\[E0\]/);
  assert.doesNotMatch(out.text, /\[E7\]/);
  assert.equal(out.blocked, false);
});

void test("strict sanitize withholds draft containing invented facts", () => {
  const b = goodBundle();
  const invented = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
  const draft = `Watch ${invented} [E0].`;
  const idx = new EvidenceIndex(b);
  const res = validateDraft(draft, b, idx.knowledgeMap());
  const out = sanitizeDraft(draft, res, { strict: true });
  assert.equal(out.blocked, true);
  assert.match(out.text, /withheld/);
  assert.doesNotMatch(out.text, /deadbeef/);
});

// ---------------------------------------------------------------- engine

const echoProvider: ExplanationProvider = {
  name: "echo",
  generate: async (prompt: PromptPair) => `ECHO:${prompt.user.length}:${prompt.system.length}`,
};

void test("engine builds prompt and returns validated explanation", async () => {
  const engine = new GroundedExplanationEngine(echoProvider);
  const out = await engine.explain({ bundle: goodBundle(), question: "Why is this risky?" });
  assert.match(out.text, /^ECHO:/);
  assert.equal(out.refused, undefined);
  assert.equal(out.citations.get(0), "ev-approve-1");
  assert.equal(out.knowledgeByCitation.get(0), "OBSERVED");
});

void test("engine refuses to call provider with zero evidence", async () => {
  let called = 0;
  const spy: ExplanationProvider = { name: "spy", generate: async () => { called++; return "x"; } };
  const engine = new GroundedExplanationEngine(spy);
  const out = await engine.explain({ bundle: bundleWith([]), question: "q" });
  assert.equal(called, 0);
  assert.equal(out.refused, "no_evidence");
  assert.match(out.text, /unknown/);
});

void test("engine degrades gracefully on provider failure", async () => {
  const failing: ExplanationProvider = { name: "fail", generate: async () => { throw new Error("boom"); } };
  const engine = new GroundedExplanationEngine(failing);
  const out = await engine.explain({ bundle: goodBundle(), question: "q" });
  assert.equal(out.refused, "provider_error");
  assert.match(out.text, /temporarily unavailable/);
});

void test("engine blocks hallucinated draft in strict mode", async () => {
  const hallucinating: ExplanationProvider = {
    name: "hallucinator",
    generate: async () => `The owner 0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef also holds 5000000000000000000 tokens [E0].`,
  };
  const engine = new GroundedExplanationEngine(hallucinating);
  const out = await engine.explain({ bundle: goodBundle(), question: "q" });
  assert.equal(out.blocked, true);
  assert.match(out.text, /withheld/);
});

void test("EvidenceIndex maps citations to evidence ids and knowledge", () => {
  const b = goodBundle();
  const idx = new EvidenceIndex(b);
  assert.equal(idx.size, 1);
  assert.equal(idx.evidenceId(0), "ev-approve-1");
  assert.equal(idx.knowledgeOf(0), "OBSERVED");
});

// ---------------------------------------------------------------- PRISM

void test("evaluateExplanation computes signals", () => {
  const b = goodBundle();
  const draft = `Owner ${ADDR_A} approved spender ${ADDR_C} on token ${ADDR_B} [E0].`;
  const idx = new EvidenceIndex(b);
  const validation = validateDraft(draft, b, idx.knowledgeMap());
  const ev = evaluateExplanation({
    requestId: "req-1",
    bundle: b,
    requestQuestion: "q",
    draft,
    validation,
  });
  assert.equal(ev.signals.citationCoverage, 1);
  assert.equal(ev.signals.unsupportedClaims, 0);
  assert.equal(ev.verdict, "pass");
});

void test("evaluateExplanation fails on unsupported claims", () => {
  const b = goodBundle();
  const invented = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
  const draft = `Watch ${invented} [E0].`;
  const idx = new EvidenceIndex(b);
  const validation = validateDraft(draft, b, idx.knowledgeMap());
  const ev = evaluateExplanation({ requestId: "req-2", bundle: b, requestQuestion: "q", draft, validation });
  assert.equal(ev.signals.unsupportedClaims, 1);
  assert.equal(ev.verdict, "fail");
});

void test("verdictFor warns on low citation coverage", () => {
  assert.equal(verdictFor({ citationCoverage: 0.5 }), "warn");
  assert.equal(verdictFor({}), "pass");
  assert.equal(verdictFor({ knowledgeSeparationOk: false }), "fail");
});

void test("knowledge separation requires Inferred marker", () => {
  const b = bundleWith([
    baseRecord({
      id: "ev-inf",
      knowledgeType: "INFERRED",
      source: { tool: "deterministic-inference", locator: "rule:approvals>5" },
      token: ADDR_B, owner: ADDR_A, spender: ADDR_C, amount: "1", unlimited: false, txHash: TX,
    }),
  ]);
  const draftNoMarker = `Owner ${ADDR_A} approved ${ADDR_C}.`;
  const draftWithMarker = `Inferred: repeated approvals suggest automation.`;
  const idx = new EvidenceIndex(b);
  const v1 = validateDraft(draftNoMarker, b, idx.knowledgeMap());
  const v2 = validateDraft(draftWithMarker, b, idx.knowledgeMap());
  const e1 = evaluateExplanation({ requestId: "r", bundle: b, requestQuestion: "q", draft: draftNoMarker, validation: v1 });
  const e2 = evaluateExplanation({ requestId: "r", bundle: b, requestQuestion: "q", draft: draftWithMarker, validation: v2 });
  assert.equal(e1.signals.knowledgeSeparationOk, false);
  assert.equal(e2.signals.knowledgeSeparationOk, true);
});

void test("NullPrismClient is a silent no-op", async () => {
  const p = new NullPrismClient();
  await p.submitEvaluation({ requestId: "r", createdAt: new Date().toISOString(), signals: {}, verdict: "pass" });
  await p.submitSpan({ name: "s", requestId: "r", startedAt: "t", endedAt: "t", attributes: {} });
  await p.submitMetrics([{ name: "m", value: 1 }]);
});

// ---------------------------------------------------------------- evidence record typing

void test("role evidence validates roleName optional", () => {
  const roleRec = baseRecord({
    id: "ev-role",
    kind: "role",
    contract: ADDR_B,
    roleHash: ROLE,
    roleName: "DEFAULT_ADMIN_ROLE",
    holder: ADDR_C,
    granted: true,
  });
  const b = bundleWith([roleRec]);
  assert.equal((b.records[0] as EvidenceRecord).knowledgeType, "OBSERVED");
});
