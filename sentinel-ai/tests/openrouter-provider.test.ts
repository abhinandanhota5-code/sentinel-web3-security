import { test } from "node:test";
import { strict as assert } from "node:assert";

import {
  OpenRouterExplanationProvider,
  OpenRouterProviderError,
  redactOpenRouterSecrets,
  DEFAULT_OPENROUTER_MODEL,
  type OpenRouterClientLike,
  type OpenRouterRequestBody,
  type OpenRouterSuccessResponse,
} from "../dist/providers/openrouter.js";
import { MockExplanationProvider } from "../dist/providers/mock.js";
import { GroundedExplanationEngine } from "../dist/engine.js";
import { goodBundle, ADDR_A, ADDR_C } from "./helpers/evidence.fixtures.ts";

interface RecordedCall {
  body: OpenRouterRequestBody;
}

function fakeClient(
  impl: (body: OpenRouterRequestBody) => Promise<OpenRouterSuccessResponse>,
): { client: OpenRouterClientLike; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  return {
    calls,
    client: {
      complete: async (body: OpenRouterRequestBody) => {
        calls.push({ body });
        return impl(body);
      },
    },
  };
}

function okResponse(text: string): OpenRouterSuccessResponse {
  return { choices: [{ message: { role: "assistant", content: text }, finish_reason: "stop" }] };
}

function emptyResponse(finish: string): OpenRouterSuccessResponse {
  return { choices: [{ message: { role: "assistant", content: null }, finish_reason: finish }] };
}

function httpError(status: number, message: string): OpenRouterProviderError {
  return new OpenRouterProviderError(`OpenRouter API request failed: HTTP ${status}: ${message}`);
}

// Save/restore OPENROUTER_API_KEY without ever persisting a real key in-process.
function withTestKey(run: () => void | Promise<void>): () => Promise<void> {
  return async () => {
    const original = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    try {
      process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key-1234567890";
      await run();
    } finally {
      delete process.env.OPENROUTER_API_KEY;
      if (original !== undefined) process.env.OPENROUTER_API_KEY = "restored-placeholder";
    }
  };
}

// ------------------------------------------------------------- transport

void test(
  "successful generation returns only the generated text",
  withTestKey(async () => {
    const { client, calls } = fakeClient(async () => okResponse("  grounded text  "));
    const provider = new OpenRouterExplanationProvider({ clientFactory: () => client });
    const out = await provider.generate({ system: "SYSTEM CONTRACT", user: "USER TURN" }, {});
    assert.equal(out, "grounded text");
    assert.equal(calls.length, 1);
    const body = calls[0]!.body;
    assert.equal(body.model, DEFAULT_OPENROUTER_MODEL);
    assert.deepEqual(
      body.messages,
      [
        { role: "system", content: "SYSTEM CONTRACT" },
        { role: "user", content: "USER TURN" },
      ],
    );
    assert.ok(typeof body.temperature === "number");
    assert.ok(body.max_tokens > 0);
  }),
);

void test(
  "constructor reads OPENROUTER_API_KEY from environment",
  withTestKey(() => {
    const { client } = fakeClient(async () => okResponse("ok"));
    const provider = new OpenRouterExplanationProvider({ clientFactory: () => client });
    assert.equal(provider.name, "openrouter");
  }),
);

void test("constructor throws when OPENROUTER_API_KEY is missing", () => {
  const original = process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  try {
    assert.throws(
      () => new OpenRouterExplanationProvider(),
      (err: unknown) => err instanceof OpenRouterProviderError && /OPENROUTER_API_KEY/.test(err.message),
    );
  } finally {
    delete process.env.OPENROUTER_API_KEY;
    if (original !== undefined) process.env.OPENROUTER_API_KEY = "restored-placeholder";
  }
});

void test("constructor throws when OPENROUTER_API_KEY is blank", () => {
  process.env.OPENROUTER_API_KEY = "   ";
  try {
    assert.throws(() => new OpenRouterExplanationProvider(), OpenRouterProviderError);
  } finally {
    delete process.env.OPENROUTER_API_KEY;
  }
});

void test("model override wins over the default", async () => {
  process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key-1234567890";
  try {
    const { client, calls } = fakeClient(async () => okResponse("ok"));
    const provider = new OpenRouterExplanationProvider({
      clientFactory: () => client,
      model: "z-ai/glm-5.3-flash",
    });
    await provider.generate({ system: "s", user: "u" }, {});
    assert.equal(calls[0]?.body.model, "z-ai/glm-5.3-flash");
  } finally {
    delete process.env.OPENROUTER_API_KEY;
  }
});

// ------------------------------------------------------------- failures

void test("API failure is normalized into OpenRouterProviderError", async () => {
  process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key-1234567890";
  try {
    const { client } = fakeClient(async () => {
      throw httpError(503, "upstream unavailable");
    });
    const provider = new OpenRouterExplanationProvider({ clientFactory: () => client });
    await assert.rejects(
      provider.generate({ system: "s", user: "u" }, {}),
      (err: unknown) =>
        err instanceof OpenRouterProviderError && /HTTP 503: upstream unavailable/.test(err.message),
    );
  } finally {
    delete process.env.OPENROUTER_API_KEY;
  }
});

void test("transient 503 is retried and recovers within one generate() call", async () => {
  process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key-1234567890";
  try {
    let attempts = 0;
    const { client } = fakeClient(async () => {
      attempts++;
      if (attempts < 3) throw httpError(503, "overloaded");
      return okResponse("recovered");
    });
    const provider = new OpenRouterExplanationProvider({
      clientFactory: () => client,
      maxRetries: 2,
      timeoutMs: 1_000,
    });
    const out = await provider.generate({ system: "s", user: "u" }, {});
    assert.equal(out, "recovered");
    assert.equal(attempts, 3);
  } finally {
    delete process.env.OPENROUTER_API_KEY;
  }
});

void test("persistent 503 exhausts retries and surfaces OpenRouterProviderError", async () => {
  process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key-1234567890";
  try {
    let attempts = 0;
    const { client } = fakeClient(async () => {
      attempts++;
      throw httpError(503, "down");
    });
    const provider = new OpenRouterExplanationProvider({
      clientFactory: () => client,
      maxRetries: 1,
      timeoutMs: 1_000,
    });
    await assert.rejects(provider.generate({ system: "s", user: "u" }, {}), (err: unknown) => {
      assert.ok(err instanceof OpenRouterProviderError);
      assert.equal(attempts, 2);
      return true;
    });
  } finally {
    delete process.env.OPENROUTER_API_KEY;
  }
});

void test("429 rate limit is transient", async () => {
  process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key-1234567890";
  try {
    let attempts = 0;
    const { client } = fakeClient(async () => {
      attempts++;
      if (attempts < 2) throw httpError(429, "rate limit exceeded");
      return okResponse("ok");
    });
    const provider = new OpenRouterExplanationProvider({
      clientFactory: () => client,
      maxRetries: 2,
      timeoutMs: 1_000,
    });
    const out = await provider.generate({ system: "s", user: "u" }, {});
    assert.equal(out, "ok");
    assert.equal(attempts, 2);
  } finally {
    delete process.env.OPENROUTER_API_KEY;
  }
});

void test("402 insufficient credits is NOT retried", async () => {
  process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key-1234567890";
  try {
    let attempts = 0;
    const { client } = fakeClient(async () => {
      attempts++;
      throw httpError(402, "Insufficient credits to run this model");
    });
    const provider = new OpenRouterExplanationProvider({
      clientFactory: () => client,
      maxRetries: 3,
      timeoutMs: 1_000,
    });
    await assert.rejects(
      provider.generate({ system: "s", user: "u" }, {}),
      (err: unknown) =>
        err instanceof OpenRouterProviderError && /402/.test(err.message) && attempts === 1,
    );
    assert.equal(attempts, 1, "402 must not be retried");
  } finally {
    delete process.env.OPENROUTER_API_KEY;
  }
});

void test("401 auth error is NOT retried", async () => {
  process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key-1234567890";
  try {
    let attempts = 0;
    const { client } = fakeClient(async () => {
      attempts++;
      throw httpError(401, "No auth credentials found");
    });
    const provider = new OpenRouterExplanationProvider({
      clientFactory: () => client,
      maxRetries: 3,
      timeoutMs: 1_000,
    });
    await assert.rejects(provider.generate({ system: "s", user: "u" }, {}), OpenRouterProviderError);
    assert.equal(attempts, 1);
  } finally {
    delete process.env.OPENROUTER_API_KEY;
  }
});

void test("empty content with finish_reason length is rejected, not returned", async () => {
  process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key-1234567890";
  try {
    const { client } = fakeClient(async () => emptyResponse("length"));
    const provider = new OpenRouterExplanationProvider({ clientFactory: () => client });
    await assert.rejects(
      provider.generate({ system: "s", user: "u" }, {}),
      (err: unknown) =>
        err instanceof OpenRouterProviderError &&
        /empty response.*finish_reason: length/.test(err.message),
    );
  } finally {
    delete process.env.OPENROUTER_API_KEY;
  }
});

void test("in-band error payload is surfaced as a provider error", async () => {
  process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key-1234567890";
  try {
    const { client } = fakeClient(async () => ({ error: { message: "model not found", code: 404 } }));
    const provider = new OpenRouterExplanationProvider({ clientFactory: () => client });
    await assert.rejects(
      provider.generate({ system: "s", user: "u" }, {}),
      (err: unknown) => err instanceof OpenRouterProviderError && /model not found/.test(err.message),
    );
  } finally {
    delete process.env.OPENROUTER_API_KEY;
  }
});

void test("timeout aborts the request and throws OpenRouterProviderError", async () => {
  process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key-1234567890";
  try {
    const { client } = fakeClient(
      () =>
        new Promise<OpenRouterSuccessResponse>((_resolve, reject) => {
          setTimeout(() => reject(new Error("should not settle normally")), 5_000);
        }),
    );
    const provider = new OpenRouterExplanationProvider({ clientFactory: () => client, timeoutMs: 25 });
    await assert.rejects(
      provider.generate({ system: "s", user: "u" }, {}),
      (err: unknown) => err instanceof OpenRouterProviderError && /(timed out|aborted)/i.test(err.message),
    );
  } finally {
    delete process.env.OPENROUTER_API_KEY;
  }
});

void test("external abort signal propagates as OpenRouterProviderError", async () => {
  process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key-1234567890";
  try {
    const { client } = fakeClient(() => new Promise<OpenRouterSuccessResponse>(() => {/* never settles */}));
    const provider = new OpenRouterExplanationProvider({ clientFactory: () => client, timeoutMs: 5_000 });
    const controller = new AbortController();
    const pending = provider.generate({ system: "s", user: "u" }, { signal: controller.signal });
    setTimeout(() => controller.abort(), 20);
    await assert.rejects(pending, OpenRouterProviderError);
  } finally {
    delete process.env.OPENROUTER_API_KEY;
  }
});

void test("aborted-before-start throws immediately", async () => {
  process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key-1234567890";
  try {
    const { client, calls } = fakeClient(async () => okResponse("nope"));
    const provider = new OpenRouterExplanationProvider({ clientFactory: () => client });
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(
      provider.generate({ system: "s", user: "u" }, { signal: controller.signal }),
      OpenRouterProviderError,
    );
    assert.equal(calls.length, 0);
  } finally {
    delete process.env.OPENROUTER_API_KEY;
  }
});

// ------------------------------------------------------------- redaction

void test("redactOpenRouterSecrets removes OpenRouter keys from error messages", () => {
  const leaked = "request failed for key sk-or-v1-abcdef1234567890abcdef";
  const cleaned = redactOpenRouterSecrets(leaked);
  assert.doesNotMatch(cleaned, /sk-or-v1-abcdef1234567890/);
  assert.match(cleaned, /\[redacted\]/);

  const cleaned2 = redactOpenRouterSecrets("bad key: super-secret-value", "super-secret-value");
  assert.doesNotMatch(cleaned2, /super-secret-value/);
  assert.match(cleaned2, /\[redacted\]/);
});

void test("error carrying the key is redacted", async () => {
  process.env.OPENROUTER_API_KEY = "sk-or-v1-TESTKEYVALUE123456";
  try {
    const { client } = fakeClient(async () => {
      throw new Error("auth failed for key sk-or-v1-TESTKEYVALUE123456");
    });
    const provider = new OpenRouterExplanationProvider({ clientFactory: () => client });
    try {
      await provider.generate({ system: "s", user: "u" }, {});
      assert.fail("expected rejection");
    } catch (err) {
      assert.ok(err instanceof OpenRouterProviderError);
      assert.doesNotMatch(err.message, /sk-or-v1-TESTKEYVALUE123456/);
    }
  } finally {
    delete process.env.OPENROUTER_API_KEY;
  }
});

void test("provider does not log: console stays silent during failures", async () => {
  const logs: unknown[] = [];
  const originalLog = console.log;
  const originalError = console.error;
  console.log = (...args: unknown[]) => logs.push(args);
  console.error = (...args: unknown[]) => logs.push(args);
  try {
    process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key-1234567890";
    const { client } = fakeClient(async () => {
      throw new Error("boom");
    });
    const provider = new OpenRouterExplanationProvider({ clientFactory: () => client });
    await assert.rejects(provider.generate({ system: "s", user: "u" }, {}), OpenRouterProviderError);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    delete process.env.OPENROUTER_API_KEY;
  }
  assert.equal(logs.length, 0);
});

// --------------------------------------------------- engine integration paths

void test("GroundedExplanationEngine returns existing provider_error on OpenRouter failure", async () => {
  process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key-1234567890";
  try {
    const { client } = fakeClient(async () => {
      throw httpError(503, "service down");
    });
    const provider = new OpenRouterExplanationProvider({ clientFactory: () => client });
    // Retry path is covered by provider tests; disable here for speed.
    (provider as unknown as { maxRetries: number }).maxRetries = 0;
    const engine = new GroundedExplanationEngine(provider);
    const explanation = await engine.explain({ bundle: goodBundle(), question: "q" });
    assert.equal(explanation.refused, "provider_error");
    assert.match(explanation.text, /temporarily unavailable/);
    assert.match(explanation.providerError ?? "", /HTTP 503: service down/);
  } finally {
    delete process.env.OPENROUTER_API_KEY;
  }
});

void test("engine still runs hallucination safeguards on OpenRouter output", async () => {
  process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key-1234567890";
  try {
    const invented = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
    const { client } = fakeClient(async () =>
      okResponse(`Watch ${invented}, owner ${ADDR_A}, spender ${ADDR_C} [E0].`),
    );
    const provider = new OpenRouterExplanationProvider({ clientFactory: () => client });
    const engine = new GroundedExplanationEngine(provider);
    const explanation = await engine.explain({ bundle: goodBundle(), question: "q" });
    assert.equal(explanation.blocked, true);
    assert.doesNotMatch(explanation.text, /deadbeef/);
    assert.ok(explanation.validation.unsupportedClaims.some((c) => c.literal === invented));
  } finally {
    delete process.env.OPENROUTER_API_KEY;
  }
});

void test("happy path: grounded OpenRouter output flows through the engine unmodified", async () => {
  process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key-1234567890";
  try {
    const { client } = fakeClient(async () =>
      okResponse(`Owner ${ADDR_A} approved spender ${ADDR_C} [E0].`),
    );
    const provider = new OpenRouterExplanationProvider({ clientFactory: () => client });
    const engine = new GroundedExplanationEngine(provider);
    const explanation = await engine.explain({ bundle: goodBundle(), question: "q" });
    assert.equal(explanation.blocked, false);
    assert.equal(explanation.refused, undefined);
    assert.match(explanation.text, /\[E0\]/);
  } finally {
    delete process.env.OPENROUTER_API_KEY;
  }
});

// ------------------------------------------------------------- mock provider

void test("mock provider still records calls (regression guard)", async () => {
  const mock = new MockExplanationProvider(() => "scripted [E0] answer");
  const out = await mock.generate({ system: "s", user: "u" }, {});
  assert.equal(out, "scripted [E0] answer");
  assert.equal(mock.calls.length, 1);
});
