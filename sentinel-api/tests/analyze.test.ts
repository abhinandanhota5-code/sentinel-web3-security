/**
 * Integration tests: deterministic security engine -> adapter -> @sentinel/ai
 * -> HTTP response. Uses fake engine bundles shaped exactly like the real
 * security-engine output, plus one test running the actual CJS engine against
 * its demo provider — the true integration path without network or API keys.
 */

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import type { Express } from "express";
import type { Server } from "node:http";
import { buildApp, type SecurityEnginePort } from "../dist/app.js";
import { loadConfig } from "../dist/config.js";
import type { EngineBundle, EngineFinding } from "../dist/engine-adapter.js";
import { adaptFinding, normalizeChain } from "../dist/engine-adapter.js";
import { MockExplanationProvider } from "@sentinel/ai";

// ------------------------------------------------------------- fixtures

const WALLET = "0x1111111111111111111111111111111111111111";
const TOKEN = "0x2222222222222222222222222222222222222222";
const SPENDER = "0x3333333333333333333333333333333333333333";
const PROTOCOL = "0x4444444444444444444444444444444444444444";
const IMPL = "0x5555555555555555555555555555555555555555";
const TX = `0x${"aa".repeat(32)}`;
const MAX_UINT = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

let seq = 0;
function finding(over: Partial<EngineFinding> & { findingType: string }): EngineFinding {
  seq += 1;
  return {
    id: `E${seq}`,
    kind: "approval",
    knowledgeType: "OBSERVED",
    severity: "INFO",
    entity: WALLET,
    chain: "ethereum",
    wallet: WALLET,
    evidence: {},
    sourceReferences: {},
    explanationInputs: {},
    coverageGaps: [],
    ...over,
  };
}

/** Rich fixture: classification, history, unlimited approval, exposure, proxy. */
function richBundle(): EngineBundle {
  seq = 0;
  return {
    schemaVersion: "1.0",
    bundleType: "SENTINEL_EVIDENCE",
    dataMode: "DEMO",
    chain: "ethereum",
    address: WALLET,
    addressType: "SMART_CONTRACT",
    evidence: [
      finding({ id: "E1", kind: "address", findingType: "ADDRESS_CLASSIFICATION", evidence: { contractAddress: WALLET }, explanationInputs: { addressType: "SMART_CONTRACT" } }),
      finding({ id: "E2", kind: "transaction", findingType: "TRANSACTION_COUNT", evidence: { transactionCount: 2 }, explanationInputs: { transactionCount: 2 } }),
      finding({ id: "E3", kind: "transaction", findingType: "FIRST_ACTIVITY", evidence: { transactionHash: TX, blockNumber: 190, timestamp: "2026-01-02T00:00:00Z" } }),
      finding({ id: "E4", kind: "approval", findingType: "ACTIVE_APPROVAL", allowance: MAX_UINT, evidence: { tokenAddress: TOKEN, spenderAddress: SPENDER, allowance: MAX_UINT, transactionHash: TX, blockNumber: 190 } }),
      finding({ id: "E5", kind: "approval", findingType: "UNLIMITED_ALLOWANCE", severity: "HIGH", allowance: MAX_UINT, evidence: { tokenAddress: TOKEN, spenderAddress: SPENDER, allowance: MAX_UINT, transactionHash: TX, blockNumber: 190 }, explanationInputs: { allowance: "MAX_UINT256" } }),
      finding({ id: "E6", kind: "exposure", findingType: "CURRENT_TOKEN_EXPOSURE", knowledgeType: "INFERRED", severity: "HIGH", allowance: MAX_UINT, evidence: { tokenAddress: TOKEN, spenderAddress: SPENDER, allowance: MAX_UINT, tokenBalance: "1250000000000000000", tokenSymbol: "DEMO" }, explanationInputs: { activePermission: true, currentBalance: "1250000000000000000", exposure: true } }),
      finding({ id: "E7", kind: "upgradeability", findingType: "PROXY_DETECTED", severity: "HIGH", entity: PROTOCOL, contractAddress: PROTOCOL, evidence: { contractAddress: PROTOCOL, implementationAddress: IMPL, adminAddress: SPENDER, slot: "eip1967.proxy.implementation" }, explanationInputs: { proxyDetected: true } }),
    ],
    coverageGaps: [],
  };
}

/** Fixture where the RPC adapter failed: engine emits UNKNOWN, not evidence. */
function rpcFailureBundle(): EngineBundle {
  seq = 0;
  return {
    schemaVersion: "1.0",
    dataMode: "MIXED",
    chain: "ethereum",
    address: WALLET,
    addressType: "UNKNOWN",
    evidence: [
      finding({ id: "E1", kind: "address", findingType: "ADDRESS_CLASSIFICATION", evidence: { contractAddress: WALLET } }),
      finding({ id: "E2", kind: "upgradeability", findingType: "UPGRADEABILITY", knowledgeType: "UNKNOWN", severity: "UNKNOWN", entity: WALLET, coverageGaps: ["Provider proxy lookup failed: RPC HTTP 500"] }),
    ],
    coverageGaps: [],
  };
}

/** Fixture where the Etherscan (indexed) side failed. */
function etherscanFailureBundle(): EngineBundle {
  seq = 0;
  return {
    schemaVersion: "1.0",
    dataMode: "MIXED",
    chain: "ethereum",
    address: WALLET,
    addressType: "EOA",
    evidence: [
      finding({ id: "E1", kind: "address", findingType: "ADDRESS_CLASSIFICATION", evidence: { contractAddress: WALLET } }),
      finding({ id: "E2", kind: "transaction", findingType: "TRANSACTION_HISTORY", knowledgeType: "UNKNOWN", severity: "UNKNOWN", entity: WALLET, coverageGaps: ["Provider transaction history failed: Etherscan txlist failed: rate limit reached"] }),
    ],
    coverageGaps: [],
  };
}

// ------------------------------------------------------------- helpers

interface TestServer {
  baseUrl: string;
  close: () => Promise<void>;
}

function buildTestApp(engineBundle: EngineBundle, provider?: MockExplanationProvider): Express {
  const securityEngine: SecurityEnginePort = {
    analyzeAddressSecurity: async () => engineBundle,
  };
  return buildApp({
    config: loadConfig({} as NodeJS.ProcessEnv),
    securityEngine,
    blockchainProvider: { fake: true },
    ...(provider ? { explanationProvider: provider } : {}),
  });
}

async function startServer(app: Express): Promise<TestServer> {
  const server: Server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  const port = typeof address === "object" && address !== null ? address.port : 0;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

async function analyze(baseUrl: string, body: unknown): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await fetch(`${baseUrl}/api/v1/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

function mockProvider(): MockExplanationProvider {
  return new MockExplanationProvider(
    () => "Engine evidence explains the posture [E0].",
  );
}

// ------------------------------------------------- adapter unit behavior

void test("normalizeChain maps ethereum to eip155:1 at the boundary only", () => {
  assert.equal(normalizeChain("ethereum"), "eip155:1");
  assert.equal(normalizeChain("ETHEREUM"), "eip155:1");
  assert.equal(normalizeChain("polygon"), "polygon"); // passthrough, documented
  assert.equal(normalizeChain(undefined), "eip155:1");
});

void test("INFERRED findings cite their rule basis in source.locator", () => {
  const record = adaptFinding(
    { id: "E9", findingType: "CURRENT_TOKEN_EXPOSURE", knowledgeType: "INFERRED", chain: "ethereum" },
    "REAL",
    "2026-09-19T10:00:00Z",
  );
  assert.equal(record.source.locator, "rule:CURRENT_TOKEN_EXPOSURE");
  const observed = adaptFinding(
    { id: "E1", findingType: "ACTIVE_APPROVAL", knowledgeType: "OBSERVED", chain: "ethereum" },
    "REAL",
    "2026-09-19T10:00:00Z",
  );
  assert.equal(observed.source.locator, "dataMode:REAL");
});

// ------------------------------------------------------- analyze happy path

void test("analyze: valid address flows engine -> adapter -> AI -> response", async () => {
  const provider = mockProvider();
  const app = buildTestApp(richBundle(), provider);
  const s = await startServer(app);
  try {
    const { status, body } = await analyze(s.baseUrl, { address: WALLET, chain: "ethereum" });
    assert.equal(status, 200);
    assert.equal((body.subject as Record<string, unknown>).chain, "eip155:1");
    assert.equal((body.subject as Record<string, unknown>).address, WALLET);
    assert.equal(body.dataMode, "DEMO");
    const evidence = body.evidence as { records: Array<Record<string, unknown>> };
    const findings = body.findings as Array<Record<string, unknown>>;
    assert.equal(evidence.records.length, findings.length);
    assert.equal(evidence.records[0]?.id, "E1");
    assert.equal(typeof (body.explanation as Record<string, unknown>).text, "string");
    assert.equal((body.explanation as Record<string, unknown>).blocked, false);
  } finally {
    await s.close();
  }
});

void test("analyze: unlimited allowance reaches the AI prompt with exact evidence", async () => {
  const provider = mockProvider();
  const app = buildTestApp(richBundle(), provider);
  const s = await startServer(app);
  try {
    const { status } = await analyze(s.baseUrl, { address: WALLET, chain: "ethereum" });
    assert.equal(status, 200);
    const prompt = provider.calls[0]?.prompt.user ?? "";
    assert.match(prompt, /UNLIMITED_ALLOWANCE/);
    assert.match(prompt, new RegExp(TX.slice(0, 12))); // tx hash literal preserved
    assert.match(prompt, new RegExp(SPENDER.slice(0, 12)));
  } finally {
    await s.close();
  }
});

void test("analyze: proxy/upgradeability finding reaches the AI correctly", async () => {
  const provider = mockProvider();
  const app = buildTestApp(richBundle(), provider);
  const s = await startServer(app);
  try {
    const { status, body } = await analyze(s.baseUrl, { address: WALLET, chain: "ethereum" });
    assert.equal(status, 200);
    const prompt = provider.calls[0]?.prompt.user ?? "";
    assert.match(prompt, /PROXY_DETECTED/);
    assert.match(prompt, /eip1967\.proxy\.implementation/);
    const findings = body.findings as Array<{ findingType: string; severity: string }>;
    const proxy = findings.find((f) => f.findingType === "PROXY_DETECTED");
    assert.equal(proxy?.severity, "HIGH");
  } finally {
    await s.close();
  }
});

void test("analyze: OBSERVED / INFERRED / UNKNOWN knowledge types are preserved", async () => {
  const app = buildTestApp(richBundle(), mockProvider());
  const s = await startServer(app);
  try {
    const { status, body } = await analyze(s.baseUrl, { address: WALLET, chain: "ethereum" });
    assert.equal(status, 200);
    const evidence = body.evidence as { records: Array<{ id: string; knowledgeType: string; finding: { findingType: string } }> };
    const byId = new Map(evidence.records.map((r) => [r.id, r]));
    assert.equal(byId.get("E4")?.knowledgeType, "OBSERVED"); // ACTIVE_APPROVAL
    assert.equal(byId.get("E6")?.knowledgeType, "INFERRED"); // CURRENT_TOKEN_EXPOSURE
    // no UNKNOWN findings in this fixture: every record keeps its engine label
    for (const r of evidence.records) {
      assert.ok(["OBSERVED", "INFERRED", "UNKNOWN"].includes(r.knowledgeType));
    }
  } finally {
    await s.close();
  }
});

void test("analyze: INFERRED record keeps rule locator; adapter bundle is schema-valid", async () => {
  const app = buildTestApp(richBundle(), mockProvider());
  const s = await startServer(app);
  try {
    const { status, body } = await analyze(s.baseUrl, { address: WALLET, chain: "ethereum" });
    assert.equal(status, 200); // route re-validates the adapted bundle via parseEvidenceBundle
    const evidence = body.evidence as { records: Array<{ knowledgeType: string; source: { locator: string } }> };
    const inferred = evidence.records.find((r) => r.knowledgeType === "INFERRED");
    assert.ok(inferred);
    assert.match(inferred.source.locator, /^rule:/);
  } finally {
    await s.close();
  }
});

void test("analyze: verbatim allowance string survives the adapter", async () => {
  const app = buildTestApp(richBundle(), mockProvider());
  const s = await startServer(app);
  try {
    const { status, body } = await analyze(s.baseUrl, { address: WALLET, chain: "ethereum" });
    assert.equal(status, 200);
    const evidence = body.evidence as { records: Array<{ finding: { allowance?: string } }> };
    const approval = evidence.records.find((r) => r.finding.allowance === MAX_UINT);
    assert.ok(approval); // hex allowance preserved exactly, not converted
  } finally {
    await s.close();
  }
});

// ------------------------------------------------- UNKNOWN + failures

void test("analyze: RPC failure stays UNKNOWN and is never a positive finding", async () => {
  const app = buildTestApp(rpcFailureBundle(), mockProvider());
  const s = await startServer(app);
  try {
    const { status, body } = await analyze(s.baseUrl, { address: WALLET, chain: "ethereum" });
    assert.equal(status, 200);
    const findings = body.findings as Array<{ findingType: string; knowledgeType: string; severity: string; coverageGaps: string[] }>;
    const upgradeability = findings.find((f) => f.findingType === "UPGRADEABILITY");
    assert.ok(upgradeability);
    assert.equal(upgradeability.knowledgeType, "UNKNOWN");
    assert.equal(upgradeability.severity, "UNKNOWN");
    assert.match(upgradeability.coverageGaps[0] ?? "", /RPC HTTP 500/);
    // No fabricated positive finding for the failed check:
    assert.ok(!findings.some((f) => f.findingType === "PROXY_DETECTED"));
    const unknowns = body.unknowns as Array<{ reason: string; detail?: string }>;
    assert.ok(unknowns.some((u) => u.reason === "source_unreachable" && /RPC HTTP 500/.test(u.detail ?? "")));
  } finally {
    await s.close();
  }
});

void test("analyze: Etherscan failure stays UNKNOWN and is never a positive finding", async () => {
  const app = buildTestApp(etherscanFailureBundle(), mockProvider());
  const s = await startServer(app);
  try {
    const { status, body } = await analyze(s.baseUrl, { address: WALLET, chain: "ethereum" });
    assert.equal(status, 200);
    const findings = body.findings as Array<{ findingType: string; knowledgeType: string }>;
    const history = findings.find((f) => f.findingType === "TRANSACTION_HISTORY");
    assert.ok(history);
    assert.equal(history.knowledgeType, "UNKNOWN");
    assert.ok(!findings.some((f) => f.findingType === "TRANSACTION_COUNT"));
    const unknowns = body.unknowns as Array<{ reason: string; detail?: string }>;
    assert.ok(unknowns.some((u) => u.reason === "source_unreachable" && /rate limit/.test(u.detail ?? "")));
  } finally {
    await s.close();
  }
});

void test("analyze: provider error returns refused explanation, evidence intact", async () => {
  const failing = new MockExplanationProvider(() => {
    throw new Error("gemini quota exceeded");
  });
  const app = buildTestApp(richBundle(), failing);
  const s = await startServer(app);
  try {
    const { status, body } = await analyze(s.baseUrl, { address: WALLET, chain: "ethereum" });
    assert.equal(status, 200);
    const explanation = body.explanation as Record<string, unknown>;
    assert.equal(explanation.refused, "provider_error");
    assert.match(explanation.text as string, /temporarily unavailable/);
    assert.equal((body.findings as unknown[]).length, 7); // deterministic findings unaffected
  } finally {
    await s.close();
  }
});

void test("analyze: hallucinated draft is blocked by existing safeguards", async () => {
  const hallucinating = new MockExplanationProvider(
    () => "Watch out for 0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef [E0].",
  );
  const app = buildTestApp(richBundle(), hallucinating);
  const s = await startServer(app);
  try {
    const { status, body } = await analyze(s.baseUrl, { address: WALLET, chain: "ethereum" });
    assert.equal(status, 200);
    const explanation = body.explanation as Record<string, unknown>;
    assert.equal(explanation.blocked, true);
    assert.match(explanation.text as string, /withheld/);
  } finally {
    await s.close();
  }
});

void test("analyze: empty evidence refuses with no_evidence, no fabricated text", async () => {
  seq = 0;
  const empty: EngineBundle = {
    schemaVersion: "1.0",
    dataMode: "REAL",
    chain: "ethereum",
    address: WALLET,
    evidence: [],
    coverageGaps: [],
  };
  const app = buildTestApp(empty, mockProvider());
  const s = await startServer(app);
  try {
    const { status, body } = await analyze(s.baseUrl, { address: WALLET, chain: "ethereum" });
    assert.equal(status, 200);
    const explanation = body.explanation as Record<string, unknown>;
    assert.equal(explanation.refused, "no_evidence");
    assert.match(explanation.text as string, /unknown/i);
    assert.equal((body.findings as unknown[]).length, 0);
  } finally {
    await s.close();
  }
});

// ------------------------------------------------- request validation

void test("analyze: invalid address returns 400", async () => {
  const app = buildTestApp(richBundle(), mockProvider());
  const s = await startServer(app);
  try {
    const { status, body } = await analyze(s.baseUrl, { address: "0x1234", chain: "ethereum" });
    assert.equal(status, 400);
    assert.match(body.error as string, /address/);
  } finally {
    await s.close();
  }
});

void test("analyze: unsupported chain returns 400", async () => {
  const app = buildTestApp(richBundle(), mockProvider());
  const s = await startServer(app);
  try {
    const { status, body } = await analyze(s.baseUrl, { address: WALLET, chain: "solana" });
    assert.equal(status, 400);
    assert.match(body.error as string, /chain/);
  } finally {
    await s.close();
  }
});

void test("analyze: invalid audience returns 400", async () => {
  const app = buildTestApp(richBundle(), mockProvider());
  const s = await startServer(app);
  try {
    const { status } = await analyze(s.baseUrl, { address: WALLET, chain: "ethereum", audience: "robot" });
    assert.equal(status, 400);
  } finally {
    await s.close();
  }
});

// ------------------------------------------------- real engine path

void test("REAL integration: security-engine -> adapter -> @sentinel/ai -> response", async () => {
  const require = createRequire(import.meta.url);
  const enginePath = fileURLToPath(
    new URL("../../src/security-engine/index.js", import.meta.url),
  );
  const engine = require(enginePath) as {
    DemoBlockchainProvider: new () => unknown;
    analyzeAddressSecurity: SecurityEnginePort["analyzeAddressSecurity"];
  };
  const app = buildApp({
    config: loadConfig({} as NodeJS.ProcessEnv),
    securityEngine: engine as SecurityEnginePort,
    blockchainProvider: new engine.DemoBlockchainProvider(),
  });
  const s = await startServer(app);
  try {
    const { status, body } = await analyze(s.baseUrl, { address: WALLET, chain: "ethereum" });
    assert.equal(status, 200);

    const subject = body.subject as Record<string, unknown>;
    assert.equal(subject.chain, "eip155:1");
    assert.equal(subject.addressType, "EOA");
    assert.equal(body.dataMode, "DEMO");

    const findings = body.findings as Array<{ id: string; findingType: string; knowledgeType: string; severity: string }>;
    const unlimited = findings.find((f) => f.findingType === "UNLIMITED_ALLOWANCE");
    assert.ok(unlimited, "unlimited allowance finding present");
    assert.equal(unlimited.knowledgeType, "OBSERVED");
    assert.equal(unlimited.severity, "HIGH");

    const evidence = body.evidence as {
      records: Array<{ id: string; knowledgeType: string; source: { tool: string; locator: string }; finding: { findingType: string } }>;
    };
    assert.equal(evidence.records.length, findings.length);
    assert.equal(evidence.records[0]?.id, "E1");
    const inferred = evidence.records.find((r) => r.finding.findingType === "CURRENT_TOKEN_EXPOSURE");
    assert.ok(inferred, "inferred exposure record present");
    assert.equal(inferred.knowledgeType, "INFERRED");
    assert.match(inferred.source.locator, /^rule:/);
    assert.match(inferred.source.tool, /^security-engine:/);

    const explanation = body.explanation as Record<string, unknown>;
    assert.equal(explanation.refused, null);
    assert.equal(explanation.blocked, false);
    assert.ok((explanation.text as string).length > 0);
  } finally {
    await s.close();
  }
});
