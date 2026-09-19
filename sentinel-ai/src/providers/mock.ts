/**
 * Mock provider for tests and local development. Implements
 * {@link ExplanationProvider} without any network access so the full grounded
 * pipeline can be exercised without a real Gemini API key.
 *
 * Never use in production.
 */

import type { ExplanationProvider, PromptPair } from "../engine.js";

export interface MockProviderCall {
  prompt: PromptPair;
  opts: { signal?: AbortSignal } | undefined;
}

export type MockGenerate = (
  prompt: PromptPair,
  opts: { signal?: AbortSignal } | undefined,
  calls: MockProviderCall[],
) => string | Promise<string>;

export class MockExplanationProvider implements ExplanationProvider {
  readonly name = "mock";
  readonly calls: MockProviderCall[] = [];

  constructor(private readonly generateFn: MockGenerate = () => "Mock explanation [E0].") {}

  async generate(prompt: PromptPair, opts?: { signal?: AbortSignal }): Promise<string> {
    this.calls.push({ prompt, opts });
    return this.generateFn(prompt, opts, this.calls);
  }
}

/** Simple factory: an echo provider for prompt-shape assertions. */
export function echoMockProvider(): MockExplanationProvider {
  return new MockExplanationProvider(
    (prompt) => `ECHO:${prompt.user.length}:${prompt.system.length}`,
  );
}
