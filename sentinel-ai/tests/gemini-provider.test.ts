import { test } from "node:test";
import { strict as assert } from "node:assert";

import {
  GeminiExplanationProvider,
  GeminiProviderError,
  redactSecrets,
  DEFAULT_GEMINI_MODEL,
  type GeminiClientLike,
} from "../dist/providers/gemini.js";
import { MockExplanationProvider, echoMockProvider } from "../dist/providers/mock.js";
import { GroundedExplanationEngine } from "../dist/engine.js";
import { goodBundle, ADDR_A, ADDR_C } from "./helpers/evidence.fixtures.ts";

function fakeClient(
  impl: (req: unknown) => Promise<unknown>,
): { client: GeminiClientLike; calls: unknown[] } {
  const calls: unknown[] = [];
  return {
    calls,
    client: {
      models: {
        generateContent: async (req: unknown) => {
          calls.push(req);
          return impl(req);
        },
      },
    },
  };
}

function okResponse(text: string): unknown {
  return { text };
}

// Save/restore GEMINI_API_KEY without ever persisting a real key in-process.
function withTestKey(run: () => void | Promise<void>): () => Promise<void> {
  return async () => {
    const original = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      process.env.GEMINI_API_KEY = "test-key-1234567890";
      await run();
    } finally {
      delete process.env.GEMINI_API_KEY;
      if (original !== undefined) process.env.GEMINI_API_KEY = "restored-placeholder";
    }
  };
}

void test(
  "successful generation returns only the generated text",
  withTestKey(() => {
    const { client, calls } = fakeClient(async () => okResponse("  grounded text  "));
    const provider = new GeminiExplanationProvider({ clientFactory: () => client });
    return provider.generate({ system: "SYSTEM CONTRACT", user: "USER TURN" }, {}).then((out) => {
      assert.equal(out, "grounded text");
      assert.equal(calls.length, 1);
      const req = calls[0] as { model: string; contents: string; config: { systemInstruction: string; temperature: number } };
      assert.equal(req.model, DEFAULT_GEMINI_MODEL);
      assert.equal(req.contents, "USER TURN");
      assert.equal(req.config.systemInstruction, "SYSTEM CONTRACT");
      assert.ok(typeof req.config.temperature === "number");
    });
  }),
);

void test(
  "constructor reads GEMINI_API_KEY from environment",
  withTestKey(() => {
    const { client } = fakeClient(async () => okResponse("ok"));
    const provider = new GeminiExplanationProvider({ clientFactory: () => client });
    assert.equal(provider.name, "gemini");
  }),
);

void test("constructor throws when GEMINI_API_KEY is missing", () => {
  const original = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    assert.throws(
      () => new GeminiExplanationProvider(),
      (err: unknown) => err instanceof GeminiProviderError && /GEMINI_API_KEY/.test(err.message),
    );
  } finally {
    delete process.env.GEMINI_API_KEY;
    if (original !== undefined) process.env.GEMINI_API_KEY = "restored-placeholder";
  }
});

void test("constructor throws when GEMINI_API_KEY is blank", () => {
  process.env.GEMINI_API_KEY = "   ";
  try {
    assert.throws(() => new GeminiExplanationProvider(), GeminiProviderError);
  } finally {
    delete process.env.GEMINI_API_KEY;
  }
});

void test("API failure is normalized into GeminiProviderError", async () => {
  process.env.GEMINI_API_KEY = "test-key-1234567890";
  try {
    const { client } = fakeClient(async () => {
      throw new Error("503 upstream unavailable");
    });
    const provider = new GeminiExplanationProvider({ clientFactory: () => client });
    await assert.rejects(
      provider.generate({ system: "s", user: "u" }, {}),
      (err: unknown) => err instanceof GeminiProviderError && /503 upstream unavailable/.test(err.message),
    );
  } finally {
    delete process.env.GEMINI_API_KEY;
  }
});

void test("empty SDK response is rejected, not returned", async () => {
  process.env.GEMINI_API_KEY = "test-key-1234567890";
  try {
    const { client } = fakeClient(async () => okResponse("   "));
    const provider = new GeminiExplanationProvider({ clientFactory: () => client });
    await assert.rejects(provider.generate({ system: "s", user: "u" }, {}), GeminiProviderError);
  } finally {
    delete process.env.GEMINI_API_KEY;
  }
});

void test("timeout aborts the request and throws GeminiProviderError", async () => {
  process.env.GEMINI_API_KEY = "test-key-1234567890";
  try {
    const { client } = fakeClient(
      (_req) => new Promise((_resolve, reject) => {
        setTimeout(() => reject(new Error("should not settle normally")), 5_000);
      }),
    );
    const provider = new GeminiExplanationProvider({ clientFactory: () => client, timeoutMs: 25 });
    await assert.rejects(
      provider.generate({ system: "s", user: "u" }, {}),
      (err: unknown) => err instanceof GeminiProviderError && /(timed out|aborted)/i.test(err.message),
    );
  } finally {
    delete process.env.GEMINI_API_KEY;
  }
});

void test("external abort signal propagates as GeminiProviderError", async () => {
  process.env.GEMINI_API_KEY = "test-key-1234567890";
  try {
    const { client } = fakeClient(
      () => new Promise(() => {/* never settles */}),
    );
    const provider = new GeminiExplanationProvider({ clientFactory: () => client, timeoutMs: 5_000 });
    const controller = new AbortController();
    const pending = provider.generate({ system: "s", user: "u" }, { signal: controller.signal });
    setTimeout(() => controller.abort(), 20);
    await assert.rejects(pending, GeminiProviderError);
  } finally {
    delete process.env.GEMINI_API_KEY;
  }
});

void test("aborted-before-start throws immediately", async () => {
  process.env.GEMINI_API_KEY = "test-key-1234567890";
  try {
    const { client, calls } = fakeClient(async () => okResponse("nope"));
    const provider = new GeminiExplanationProvider({ clientFactory: () => client });
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(provider.generate({ system: "s", user: "u" }, { signal: controller.signal }), GeminiProviderError);
    assert.equal(calls.length, 0);
  } finally {
    delete process.env.GEMINI_API_KEY;
  }
});

void test("redactSecrets removes API keys from error messages", () => {
  const leaked = "request to https://host/v1?key=AIzaSyA1234567890abcdefghij failed";
  const cleaned = redactSecrets(leaked);
  assert.doesNotMatch(cleaned, /AIzaSyA1234567890/);
  assert.match(cleaned, /\[redacted\]/);

  const cleaned2 = redactSecrets("bad key: super-secret-value", "super-secret-value");
  assert.doesNotMatch(cleaned2, /super-secret-value/);
  assert.match(cleaned2, /\[redacted\]/);
});

void test("error from SDK carrying the key is redacted", async () => {
  process.env.GEMINI_API_KEY = "AIzaSyTESTKEYVALUE123456";
  try {
    const { client } = fakeClient(async () => {
      throw new Error("auth failed for key AIzaSyTESTKEYVALUE123456");
    });
    const provider = new GeminiExplanationProvider({ clientFactory: () => client });
    try {
      await provider.generate({ system: "s", user: "u" }, {});
      assert.fail("expected rejection");
    } catch (err) {
      assert.ok(err instanceof GeminiProviderError);
      assert.doesNotMatch(err.message, /AIzaSyTESTKEYVALUE123456/);
    }
  } finally {
    delete process.env.GEMINI_API_KEY;
  }
});

void test("provider does not log: console stays silent during failures", async () => {
  const logs: unknown[] = [];
  const originalLog = console.log;
  const originalError = console.error;
  console.log = (...args: unknown[]) => logs.push(args);
  console.error = (...args: unknown[]) => logs.push(args);
  try {
    process.env.GEMINI_API_KEY = "test-key-1234567890";
    const { client } = fakeClient(async () => {
      throw new Error("boom");
    });
    const provider = new GeminiExplanationProvider({ clientFactory: () => client });
    await assert.rejects(provider.generate({ system: "s", user: "u" }, {}), GeminiProviderError);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    delete process.env.GEMINI_API_KEY;
  }
  assert.equal(logs.length, 0);
});

// ------------------------------------------------------------- mock provider

void test("mock provider records calls and returns scripted text", async () => {
  const mock = new MockExplanationProvider(() => "scripted [E0] answer");
  const out = await mock.generate({ system: "s", user: "u" }, {});
  assert.equal(out, "scripted [E0] answer");
  assert.equal(mock.calls.length, 1);
  assert.equal(mock.calls[0]?.prompt.user, "u");
});

void test("echo mock provider preserves the engine prompt shape", async () => {
  const mock = echoMockProvider();
  const out = await mock.generate({ system: "SYSTEM", user: "USERTEXT" }, {});
  assert.match(out, /ECHO:/);
});

// --------------------------------------------------- engine integration paths

void test("GroundedExplanationEngine returns existing provider_error on Gemini failure", async () => {
  process.env.GEMINI_API_KEY = "test-key-1234567890";
  try {
    const { client } = fakeClient(async () => {
      throw new Error("503 service down");
    });
    const provider = new GeminiExplanationProvider({ clientFactory: () => client });
    const engine = new GroundedExplanationEngine(provider);
    const explanation = await engine.explain({ bundle: goodBundle(), question: "q" });
    assert.equal(explanation.refused, "provider_error");
    assert.match(explanation.text, /temporarily unavailable/);
  } finally {
    delete process.env.GEMINI_API_KEY;
  }
});

void test("engine still runs hallucination safeguards on Gemini output", async () => {
  process.env.GEMINI_API_KEY = "test-key-1234567890";
  try {
    const invented = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
    const { client } = fakeClient(async () =>
      okResponse(`Watch ${invented}, owner ${ADDR_A}, spender ${ADDR_C} [E0].`),
    );
    const provider = new GeminiExplanationProvider({ clientFactory: () => client });
    const engine = new GroundedExplanationEngine(provider);
    const explanation = await engine.explain({ bundle: goodBundle(), question: "q" });
    assert.equal(explanation.blocked, true);
    assert.doesNotMatch(explanation.text, /deadbeef/);
    assert.ok(explanation.validation.unsupportedClaims.some((c) => c.literal === invented));
  } finally {
    delete process.env.GEMINI_API_KEY;
  }
});

void test("happy path: grounded Gemini output flows through the engine unmodified", async () => {
  process.env.GEMINI_API_KEY = "test-key-1234567890";
  try {
    const { client } = fakeClient(async () =>
      okResponse(`Owner ${ADDR_A} approved spender ${ADDR_C} [E0].`),
    );
    const provider = new GeminiExplanationProvider({ clientFactory: () => client });
    const engine = new GroundedExplanationEngine(provider);
    const explanation = await engine.explain({ bundle: goodBundle(), question: "q" });
    assert.equal(explanation.blocked, false);
    assert.equal(explanation.refused, undefined);
    assert.match(explanation.text, /\[E0\]/);
  } finally {
    delete process.env.GEMINI_API_KEY;
  }
});
