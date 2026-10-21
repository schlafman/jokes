import { beforeEach, describe, expect, it, vi } from "vitest";

const { constructorArgs, create } = vi.hoisted(() => ({
  constructorArgs: [] as unknown[],
  create: vi.fn(),
}));

vi.mock("openai", () => ({
  default: class {
    responses = { create };
    constructor(options: unknown) {
      constructorArgs.push(options);
    }
  },
}));

import { createJokeResponse } from "@/lib/server/openaiAdapter";

beforeEach(() => {
  create.mockReset();
  create.mockResolvedValue({
    status: "completed",
    output_text: "a joke",
    output: [{ type: "message", content: [{ type: "output_text", text: "a joke" }] }],
  });
});

describe("OpenAI adapter", () => {
  it("disables SDK retries and sets a 15s per-attempt timeout", async () => {
    await createJokeResponse({ instructions: "i", input: "x" });
    expect(constructorArgs).toHaveLength(1);
    expect(constructorArgs[0]).toMatchObject({ maxRetries: 0, timeout: 15_000 });
  });

  it("sends a single Responses API request with the agreed model settings", async () => {
    await createJokeResponse({ instructions: "i", input: "x" });
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0]).toMatchObject({
      model: "gpt-5",
      instructions: "i",
      input: "x",
      reasoning: { effort: "minimal" },
      text: { verbosity: "low" },
      max_output_tokens: 1000,
      store: false,
    });
  });

  it("detects a refusal content part", async () => {
    create.mockResolvedValue({
      status: "completed",
      output_text: "",
      output: [{ type: "message", content: [{ type: "refusal", refusal: "no" }] }],
    });
    const result = await createJokeResponse({ instructions: "i", input: "x" });
    expect(result.refused).toBe(true);
  });
});
