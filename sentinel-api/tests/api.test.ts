/**
 * HTTP tests for the Sentinel API. Uses the mock provider path (no
 * GEMINI_API_KEY in the test env) and a real listener on an ephemeral port,
 * so no network access and no API key are required.
 */

import { test } from "node:test";
import { strict as assert } from "node:assert";
import type { Express } from "express";
import { buildApp, serializeExplanation, BadRequestError } from "../dist/app.js";
import { loadConfig } from "../dist/config.js";
import type { Server } from "node:http";

interface TestServer {
  baseUrl: string;
  close: () => Promise<void>;
}

async function startServer(): Promise<TestServer> {
  const app: Express = buildApp({ config: loadConfig({} as NodeJS.ProcessEnv) });
  const server: Server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  const port = typeof address === "object" && address !== null ? address.port : 0;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

interface JsonResponse {
  status: number;
  body: Record<string, unknown>;
}

async function post(baseUrl: string, path: string, payload: unknown): Promise<JsonResponse> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function get(baseUrl: string, path: string): Promise<JsonResponse> {
  const res = await fetch(`${baseUrl}${path}`);
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

const bundle = () => ({
  subject: { chain: "eip155:1", address: "0x1111111111111111111111111111111111111111" },
  assembledAt: "2026-09-19T10:00:01Z",
  engineVersion: "engine-1.0.0",
  records: [
    {
      id: "ev-approve-1",
      kind: "approval",
      chain: "eip155:1",
      source: { tool: "rpc-eth-call", version: "1.0.1", locator: "alchemy-mainnet" },
      capturedAt: "2026-09-19T10:00:00Z",
      knowledgeType: "OBSERVED",
      token: "0x2222222222222222222222222222222222222222",
      owner: "0x1111111111111111111111111111111111111111",
      spender: "0x3333333333333333333333333333333333333333",
      amount: "999999999999999999000",
      unlimited: false,
      txHash: `0x${"ab".repeat(32)}`,
    },
  ],
});

const validExplainBody = () => ({
  bundle: bundle(),
  question: "Explain this approval",
  audience: "retail",
});

// ---------------------------------------------------------------- health

void test("GET /healthz reports provider and prism client", async () => {
  const s = await startServer();
  try {
    const { status, body } = await get(s.baseUrl, "/healthz");
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.provider, "mock");
    assert.equal(body.prism, "null-prism");
  } finally {
    await s.close();
  }
});

// ---------------------------------------------------------------- explain

void test("POST /api/v1/explain returns grounded explanation (mock provider)", async () => {
  const s = await startServer();
  try {
    const { status, body } = await post(s.baseUrl, "/api/v1/explain", validExplainBody());
    assert.equal(status, 200);
    assert.equal(body.refused, null);
    assert.equal(body.blocked, false);
    assert.ok(typeof body.text === "string" && body.text.length > 0);
    assert.match(body.text as string, /E0/);
  } finally {
    await s.close();
  }
});

void test("explain maps citation ids to stable evidence ids", async () => {
  const s = await startServer();
  try {
    const { status, body } = await post(s.baseUrl, "/api/v1/explain", validExplainBody());
    assert.equal(status, 200);
    const citations = body.citations as Record<string, string>;
    const knowledge = body.knowledgeByCitation as Record<string, string>;
    assert.equal(citations["0"], "ev-approve-1");
    assert.equal(knowledge["0"], "OBSERVED");
  } finally {
    await s.close();
  }
});

void test("explain with empty records refuses with no_evidence", async () => {
  const s = await startServer();
  try {
    const b = bundle();
    b.records = [];
    const { status, body } = await post(s.baseUrl, "/api/v1/explain", { ...validExplainBody(), bundle: b });
    assert.equal(status, 200);
    assert.equal(body.refused, "no_evidence");
    assert.match(body.text as string, /unknown/i);
  } finally {
    await s.close();
  }
});

void test("explain rejects malformed bundle with 400", async () => {
  const s = await startServer();
  try {
    const { status, body } = await post(s.baseUrl, "/api/v1/explain", {
      ...validExplainBody(),
      bundle: { ...bundle(), records: [{ kind: "nonsense" }] },
    });
    assert.equal(status, 400);
    assert.match(body.error as string, /invalid evidence bundle/);
  } finally {
    await s.close();
  }
});

void test("explain rejects missing question with 400", async () => {
  const s = await startServer();
  try {
    const { status, body } = await post(s.baseUrl, "/api/v1/explain", { bundle: bundle() });
    assert.equal(status, 400);
    assert.match(body.error as string, /question/);
  } finally {
    await s.close();
  }
});

void test("explain rejects invalid audience with 400", async () => {
  const s = await startServer();
  try {
    const { status } = await post(s.baseUrl, "/api/v1/explain", { ...validExplainBody(), audience: "robot" });
    assert.equal(status, 400);
  } finally {
    await s.close();
  }
});

void test("explain rejects invalid unknowns.reason with 400", async () => {
  const s = await startServer();
  try {
    const { status } = await post(s.baseUrl, "/api/v1/explain", {
      ...validExplainBody(),
      unknowns: [{ field: "x", reason: "because" }],
    });
    assert.equal(status, 400);
  } finally {
    await s.close();
  }
});

void test("explain rejects malformed JSON with 400", async () => {
  const s = await startServer();
  try {
    const res = await fetch(`${s.baseUrl}/api/v1/explain`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    assert.equal(res.status, 400);
  } finally {
    await s.close();
  }
});

// ---------------------------------------------------------------- evaluate

void test("POST /api/v1/evaluate computes deterministic signals", async () => {
  const s = await startServer();
  try {
    const A = "0x1111111111111111111111111111111111111111";
    const C = "0x3333333333333333333333333333333333333333";
    const { status, body } = await post(s.baseUrl, "/api/v1/evaluate", {
      ...validExplainBody(),
      draft: `Owner ${A} approved spender ${C} [E0].`,
    });
    assert.equal(status, 200);
    const signals = body.signals as Record<string, unknown>;
    assert.equal(signals.citationCoverage, 1);
    assert.equal(signals.unsupportedClaims, 0);
    assert.equal(body.verdict, "pass");
  } finally {
    await s.close();
  }
});

void test("evaluate flags hallucinated literals as fail", async () => {
  const s = await startServer();
  try {
    const { status, body } = await post(s.baseUrl, "/api/v1/evaluate", {
      ...validExplainBody(),
      draft: `Watch 0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef [E0].`,
    });
    assert.equal(status, 200);
    const signals = body.signals as { unsupportedClaims: number };
    assert.equal(signals.unsupportedClaims, 1);
    assert.equal(body.verdict, "fail");
  } finally {
    await s.close();
  }
});

void test("evaluate requires draft with 400 when missing", async () => {
  const s = await startServer();
  try {
    const { status } = await post(s.baseUrl, "/api/v1/evaluate", validExplainBody());
    assert.equal(status, 400);
  } finally {
    await s.close();
  }
});

// ---------------------------------------------------------------- misc

void test("unknown route returns 404 JSON", async () => {
  const s = await startServer();
  try {
    const { status, body } = await get(s.baseUrl, "/nope");
    assert.equal(status, 404);
    assert.equal(body.error, "not found");
  } finally {
    await s.close();
  }
});

void test("serializeExplanation omits secrets and exposes safe fields", () => {
  const e = {
    text: "t",
    blocked: false,
    refused: undefined,
    citations: new Map([[0, "ev-1"]]),
    knowledgeByCitation: new Map([[0, "OBSERVED"]]),
    validation: { clean: true, strippedCitations: [], unsupportedClaims: [] },
  } as never;
  const out = serializeExplanation(e) as Record<string, unknown>;
  assert.deepEqual(Object.keys(out).sort(), [
    "blocked",
    "citations",
    "knowledgeByCitation",
    "refused",
    "text",
    "validation",
  ]);
  assert.equal(out.refused, null);
});

void test("BadRequestError carries status", () => {
  const err = new BadRequestError("nope", 413);
  assert.equal(err.status, 413);
});

void test("loadConfig reads env overrides", () => {
  const cfg = loadConfig({ PORT: "9999", GEMINI_API_KEY: "k", BODY_LIMIT: "100kb" } as NodeJS.ProcessEnv);
  assert.equal(cfg.port, 9999);
  assert.equal(cfg.geminiApiKey, "k");
  assert.equal(cfg.bodyLimit, "100kb");
});
