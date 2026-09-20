/**
 * Ollama-backed ExplanationProvider: transport only, no blockchain logic.
 * The GroundedExplanationEngine still validates and sanitizes every draft,
 * and deterministic evidence is never replaced by model output.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OllamaExplanationProvider,
  OllamaProviderError,
  DEFAULT_OLLAMA_MODEL,
  type OllamaClientLike,
  type OllamaGenerateRequest,
  type OllamaGenerateResponse,
} from "../dist/providers/ollama.js";
import type { PromptPair } from "../dist/engine.js";

const PROMPT: PromptPair = {
  system: "SYSTEM",
  user: "USER PROMPT [E0]",
};

function fakeClient(
  impl: (req: OllamaGenerateRequest) => Promise<OllamaGenerateResponse>,
): OllamaClientLike {
  return { generate: impl };
}

test("default model is llama3.1:8b and provider name is ollama", () => {
  assert.equal(DEFAULT_OLLAMA_MODEL, "llama3.1:8b");
  const provider = new OllamaExplanationProvider({
    clientFactory: () => fakeClient(async () => ({ response: "OK [E0]" })),
  });
  assert.equal(provider.name, "ollama");
});

test("generate returns the response text and maps system/user correctly", async () => {
  let captured: OllamaGenerateRequest | undefined;
  const provider = new OllamaExplanationProvider({
    baseUrl: "http://localhost:11434/",
    model: "llama3.1:8b",
    clientFactory: () =>
      fakeClient(async (req) => {
        captured = req;
        return { response: "  Grounded text [E0].  " };
      }),
  });
  const text = await provider.generate(PROMPT);
  assert.equal(text, "Grounded text [E0].");
  assert.ok(captured);
  assert.equal(captured.model, "llama3.1:8b");
  assert.equal(captured.prompt, "USER PROMPT [E0]");
  assert.equal(captured.system, "SYSTEM");
  assert.equal(captured.stream, false);
});

test("model defaults from OLLAMA_MODEL env when config omits it", async () => {
  const original = process.env.OLLAMA_MODEL;
  process.env.OLLAMA_MODEL = "llama3.1:8b-instruct-q4_K_M";
  try {
    let usedModel = "";
    const provider = new OllamaExplanationProvider({
      clientFactory: () =>
        fakeClient(async (req) => {
          usedModel = req.model;
          return { response: "x" };
        }),
    });
    await provider.generate(PROMPT);
    assert.equal(usedModel, "llama3.1:8b-instruct-q4_K_M");
  } finally {
    if (original === undefined) delete process.env.OLLAMA_MODEL;
    else process.env.OLLAMA_MODEL = original;
  }
});

test("empty response is a provider error mentioning the model", async () => {
  const provider = new OllamaExplanationProvider({
    model: "llama3.1:8b",
    clientFactory: () => fakeClient(async () => ({ response: "  " })),
  });
  await assert.rejects(
    provider.generate(PROMPT),
    (err: unknown) => err instanceof OllamaProviderError && /empty response for model llama3\.1:8b/.test(err.message),
  );
});

test("Ollama-side error payload becomes a provider error", async () => {
  const provider = new OllamaExplanationProvider({
    clientFactory: () => fakeClient(async () => ({ error: "model 'llama3.1:8b' not found" })),
  });
  await assert.rejects(
    provider.generate(PROMPT),
    (err: unknown) =>
      err instanceof OllamaProviderError &&
      /model 'llama3\.1:8b' not found/.test(err.message) &&
      err.name === "OllamaProviderError",
  );
});

test("HTTP 500 with body text surfaces status and detail, not stacks", async () => {
  const provider = new OllamaExplanationProvider({
    clientFactory: () =>
      fakeClient(async () => {
        throw new OllamaProviderError(
          "Ollama API request failed: HTTP 500: model requires more system memory",
        );
      }),
  });
  await assert.rejects(
    provider.generate(PROMPT),
    (err: unknown) =>
      err instanceof OllamaProviderError && /HTTP 500.*more system memory/s.test(err.message),
  );
});

test("connection failure is reported as unreachable with the base URL", async () => {
  const provider = new OllamaExplanationProvider({
    baseUrl: "http://127.0.0.1:1",
    timeoutMs: 50,
    clientFactory: () =>
      fakeClient(async () => {
        throw new OllamaProviderError("Ollama is unreachable at http://127.0.0.1:1: connect ECONNREFUSED");
      }),
  });
  await assert.rejects(
    provider.generate(PROMPT),
    (err: unknown) =>
      err instanceof OllamaProviderError &&
      /unreachable at http:\/\/127\.0\.0\.1:1/.test(err.message),
  );
});

test("aborted signal rejects before any request", async () => {
  const controller = new AbortController();
  controller.abort();
  let called = false;
  const provider = new OllamaExplanationProvider({
    clientFactory: () =>
      fakeClient(async () => {
        called = true;
        return { response: "x" };
      }),
  });
  await assert.rejects(
    provider.generate(PROMPT, { signal: controller.signal }),
    (err: unknown) => err instanceof OllamaProviderError && /aborted before request/.test(err.message),
  );
  assert.equal(called, false);
});
