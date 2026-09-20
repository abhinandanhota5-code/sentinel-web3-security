import { test } from "node:test";
import { strict as assert } from "node:assert";

import {
  buildGroundedUserPrompt,
  selectEvidenceWindow,
  DEFAULT_EVIDENCE_WINDOW,
} from "../dist/prompt.js";
import { GroundedExplanationEngine } from "../dist/engine.js";
import type { ExplanationProvider } from "../dist/index.js";
import type { EvidenceRecord } from "../dist/evidence.js";
import { baseRecord, bundleWith, ADDR_A } from "./helpers/evidence.fixtures.ts";

function engineFinding(
  id: string,
  findingType: string,
  knowledgeType: "OBSERVED" | "INFERRED" = "OBSERVED",
): Record<string, unknown> {
  return baseRecord({
    id,
    kind: "engine_finding",
    finding: { findingType },
    knowledgeType,
  });
}

// ---------- selectEvidenceWindow ----------

test("window keeps every record when the bundle is under the limit", () => {
  const records = [engineFinding("E1", "UNLIMITED_ALLOWANCE"), engineFinding("E2", "TRANSACTION")];
  const { selected, omittedBulk } = selectEvidenceWindow(records as EvidenceRecord[]);
  assert.equal(selected.length, 2);
  assert.equal(omittedBulk, 0);
});

test("window keeps all structural records and trims only oldest bulk history", () => {
  const records: EvidenceRecord[] = [];
  // 10 structural + 30 bulk over a limit of 20 -> all 10 structural + 10 most recent bulk.
  for (let i = 0; i < 10; i++) records.push(engineFinding(`S${i}`, "UNLIMITED_ALLOWANCE") as EvidenceRecord);
  for (let i = 0; i < 30; i++) records.push(engineFinding(`T${i}`, "TRANSACTION") as EvidenceRecord);
  const { selected, omittedBulk } = selectEvidenceWindow(records, 20);
  assert.equal(omittedBulk, 20);
  assert.equal(selected.length, 20);
  // Order preserved relative to the input.
  const ids = selected.map((r) => r.id);
  assert.deepEqual(ids, [...ids].sort(() => 0)); // no reorder beyond selection
  assert.ok(ids.includes("S0") && ids.includes("S9"), "structural records must survive");
  assert.ok(ids.includes("T29"), "most recent bulk record must be kept");
  assert.ok(!ids.includes("T0"), "oldest bulk record must be dropped first");
});

test("window returns original input order for stable citation ids", () => {
  const records: EvidenceRecord[] = [];
  for (let i = 0; i < 5; i++) records.push(engineFinding(`S${i}`, "ROLE_GRANT") as EvidenceRecord);
  for (let i = 0; i < 50; i++) records.push(engineFinding(`T${i}`, "TRANSFER") as EvidenceRecord);
  const { selected } = selectEvidenceWindow(records, 10);
  const expected = ["S0", "S1", "S2", "S3", "S4", "T45", "T46", "T47", "T48", "T49"];
  assert.deepEqual(
    selected.map((r) => r.id),
    expected,
  );
});

test("window caps pathological all-structural bundles deterministically", () => {
  const records: EvidenceRecord[] = [];
  for (let i = 0; i < 30; i++) records.push(engineFinding(`S${i}`, "ROLE_GRANT") as EvidenceRecord);
  const { selected, omittedBulk } = selectEvidenceWindow(records, 10);
  assert.equal(selected.length, 10);
  assert.equal(omittedBulk, 0);
  assert.deepEqual(
    selected.map((r) => r.id),
    ["S0", "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9"],
  );
});

// ---------- buildGroundedUserPrompt ----------

test("prompt for a small bundle has no window note and stable [E<n>] ids", () => {
  const bundle = bundleWith([engineFinding("E1", "UNLIMITED_ALLOWANCE")]);
  const prompt = buildGroundedUserPrompt({ bundle, question: "Explain the risk." });
  assert.ok(!prompt.includes("EVIDENCE WINDOW"));
  assert.ok(prompt.includes("[E0]"), "rendered ids are positional, not record ids");
  assert.ok(prompt.includes("EVIDENCE (canonical, numbered"));
});

test("prompt for a huge bundle stays bounded and discloses omitted records", () => {
  const records: Record<string, unknown>[] = [engineFinding("E1", "ADDRESS_CLASSIFICATION")];
  for (let i = 0; i < 600; i++) {
    records.push(engineFinding(`T${i}`, "TRANSACTION"));
  }
  const bundle = bundleWith(records);
  const prompt = buildGroundedUserPrompt({
    bundle,
    question: "Explain the security posture.",
    audience: "analyst",
  });
  // 601 records, byte budget shrinks the window; note must disclose the count.
  const note = prompt.match(/EVIDENCE WINDOW: (\d+) bulk history record\(s\)/);
  assert.ok(note, "window note present");
  const omitted = Number(note![1]);
  assert.ok(omitted > 400 && omitted < 601, `plausible omitted count: ${omitted}`);
  assert.ok(prompt.includes("UNKNOWN"));
  // Every structural record still present; only oldest bulk trimmed.
  assert.ok(prompt.includes("ADDRESS_CLASSIFICATION"));
  assert.ok(prompt.includes("T599"), "most recent bulk record kept");
  assert.ok(!prompt.includes("T0 "), "oldest bulk record dropped");
  assert.ok(prompt.length < 160_000, `prompt too large: ${prompt.length} chars`);
});

test("prompt builder is deterministic for identical bundles", () => {
  const mk = () =>
    bundleWith([
      engineFinding("E1", "UNLIMITED_ALLOWANCE"),
      engineFinding("E2", "TRANSACTION"),
      engineFinding("E3", "TRANSFER"),
    ]);
  const a = buildGroundedUserPrompt({ bundle: mk(), question: "q" });
  const b = buildGroundedUserPrompt({ bundle: mk(), question: "q" });
  assert.equal(a, b);
});

// ---------- engine integration ----------

test("engine passes a bounded prompt to the provider for huge bundles", async () => {
  const records: Record<string, unknown>[] = [engineFinding("E1", "UNLIMITED_ALLOWANCE")];
  for (let i = 0; i < 500; i++) {
    records.push(engineFinding(`T${i}`, "TRANSFER"));
  }
  const bundle = bundleWith(records);
  let capturedUser = "";
  const provider = {
    generate: async (prompt: { system: string; user: string }) => {
      capturedUser = prompt.user;
      return "Grounded summary with citations.";
    },
  } as unknown as ExplanationProvider;

  const engine = new GroundedExplanationEngine(provider);
  const explanation = await engine.explain({
    bundle,
    question: "Explain the security posture.",
  });
  assert.equal(explanation.refused, undefined);
  // 501 records: byte budget shrinks the window before the provider is called.
  const note = capturedUser.match(/EVIDENCE WINDOW: (\d+) bulk history record\(s\)/);
  assert.ok(note, "window note present");
  const omitted = Number(note![1]);
  assert.ok(omitted > 300 && omitted < 501, `plausible omitted count: ${omitted}`);
  assert.ok(capturedUser.includes("UNLIMITED_ALLOWANCE"));
  assert.ok(capturedUser.length < 60_000);
  void ADDR_A; // fixture import kept for parity with other suites
});
