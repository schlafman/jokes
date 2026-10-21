import {
  APIConnectionError,
  APIConnectionTimeoutError,
  AuthenticationError,
  BadRequestError,
  InternalServerError,
  RateLimitError,
} from "openai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createJokeResponse } from "@/lib/server/openaiAdapter";
import { POST } from "@/app/api/jokes/route";

vi.mock("@/lib/server/openaiAdapter", () => ({ createJokeResponse: vi.fn() }));

const adapter = vi.mocked(createJokeResponse);

function jsonRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/jokes", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function modelReturns(text: string, extra: { status?: string; refused?: boolean } = {}) {
  adapter.mockResolvedValue({ status: extra.status ?? "completed", text, refused: extra.refused ?? false });
}

async function expectError(response: Response, status: number, code: string) {
  expect(response.status).toBe(status);
  expect(await response.json()).toEqual({ error: { code } });
}

beforeEach(() => {
  vi.stubEnv("OPENAI_API_KEY", "test-key");
  vi.spyOn(console, "error").mockImplementation(() => {});
  adapter.mockReset();
  modelReturns("למה החתול ישב ליד המחשב?\nכי הוא חיפש את העכבר!");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("input validation (rejected before calling OpenAI)", () => {
  it("rejects malformed JSON", async () => {
    await expectError(await POST(jsonRequest("{not json")), 400, "INVALID_INPUT");
    expect(adapter).not.toHaveBeenCalled();
  });

  it("rejects a non-object body", async () => {
    await expectError(await POST(jsonRequest("[1,2]")), 400, "INVALID_INPUT");
    expect(adapter).not.toHaveBeenCalled();
  });

  it("rejects a non-string topic", async () => {
    await expectError(await POST(jsonRequest({ topic: 42 })), 400, "INVALID_INPUT");
    expect(adapter).not.toHaveBeenCalled();
  });

  it("rejects a non-string previousJoke", async () => {
    await expectError(await POST(jsonRequest({ topic: "x", previousJoke: {} })), 400, "INVALID_INPUT");
    expect(adapter).not.toHaveBeenCalled();
  });

  it("rejects a non-JSON content type", async () => {
    const request = jsonRequest({ topic: "x" }, { "Content-Type": "text/plain" });
    await expectError(await POST(request), 400, "INVALID_INPUT");
    expect(adapter).not.toHaveBeenCalled();
  });

  it("rejects a topic longer than 100 characters", async () => {
    await expectError(await POST(jsonRequest({ topic: "א".repeat(101) })), 400, "INVALID_INPUT");
    expect(adapter).not.toHaveBeenCalled();
  });

  it("accepts a 100-character topic with emoji (counted as one character each)", async () => {
    const topic = "😀".repeat(50) + "א".repeat(50);
    const response = await POST(jsonRequest({ topic }));
    expect(response.status).toBe(200);
  });

  it("rejects a previousJoke longer than 1000 characters", async () => {
    const response = await POST(jsonRequest({ topic: "x", previousJoke: "a".repeat(1001) }));
    await expectError(response, 400, "INVALID_INPUT");
    expect(adapter).not.toHaveBeenCalled();
  });

  it("rejects a body larger than 4KB", async () => {
    const response = await POST(jsonRequest({ topic: "x", padding: "a".repeat(5000) }));
    await expectError(response, 413, "PAYLOAD_TOO_LARGE");
    expect(adapter).not.toHaveBeenCalled();
  });

  it("rejects an oversized declared Content-Length", async () => {
    const response = await POST(jsonRequest({ topic: "x" }, { "Content-Length": "999999" }));
    await expectError(response, 413, "PAYLOAD_TOO_LARGE");
    expect(adapter).not.toHaveBeenCalled();
  });
});

describe("successful generation", () => {
  it("returns 200 with a non-empty joke, no-store, and calls OpenAI exactly once", async () => {
    const response = await POST(jsonRequest({ topic: "חתולים" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const data = await response.json();
    expect(typeof data.joke).toBe("string");
    expect(data.joke.length).toBeGreaterThan(0);
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(adapter.mock.calls[0][0].input).toContain("חתולים");
  });

  it.each([{}, { topic: "" }, { topic: "   " }])("treats %j as a general joke request", async (body) => {
    const response = await POST(jsonRequest(body));
    expect(response.status).toBe(200);
    expect(adapter.mock.calls[0][0].input).toContain("TOPIC: (none");
  });

  it("passes previousJoke to the model as data", async () => {
    await POST(jsonRequest({ topic: "חתולים", previousJoke: "בדיחה קודמת" }));
    expect(adapter.mock.calls[0][0].input).toContain("PREVIOUS_JOKE");
    expect(adapter.mock.calls[0][0].input).toContain("בדיחה קודמת");
  });
});

const GOOD = { status: "completed", text: "a joke", refused: false };
const headers = new Headers();

describe("failures without retry (exactly one OpenAI call)", () => {
  it("maps the refusal marker to 422 TOPIC_REFUSED", async () => {
    modelReturns("[[REFUSED]]");
    await expectError(await POST(jsonRequest({ topic: "x" })), 422, "TOPIC_REFUSED");
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it("maps an API refusal to 422 TOPIC_REFUSED", async () => {
    modelReturns("", { refused: true });
    await expectError(await POST(jsonRequest({ topic: "x" })), 422, "TOPIC_REFUSED");
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it("does not retry an authentication error (503)", async () => {
    adapter.mockRejectedValue(new AuthenticationError(401, {}, "bad key", headers));
    await expectError(await POST(jsonRequest({ topic: "x" })), 503, "SERVICE_UNAVAILABLE");
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it("does not retry an exhausted OpenAI budget (503)", async () => {
    adapter.mockRejectedValue(new RateLimitError(429, { code: "insufficient_quota" }, "quota", headers));
    await expectError(await POST(jsonRequest({ topic: "x" })), 503, "SERVICE_UNAVAILABLE");
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it("does not retry a bad request (502)", async () => {
    adapter.mockRejectedValue(new BadRequestError(400, {}, "bad", headers));
    await expectError(await POST(jsonRequest({ topic: "x" })), 502, "AI_UNAVAILABLE");
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it("returns 503 without calling OpenAI when the key is missing", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    await expectError(await POST(jsonRequest({ topic: "x" })), 503, "SERVICE_UNAVAILABLE");
    expect(adapter).not.toHaveBeenCalled();
  });
});

describe("transient failures (one automatic retry, never more than two calls)", () => {
  it("maps a repeated network error to 502 without leaking details", async () => {
    adapter.mockRejectedValue(new APIConnectionError({ message: "secret internal detail" }));
    const response = await POST(jsonRequest({ topic: "x" }));
    expect(await response.clone().text()).not.toContain("secret internal detail");
    await expectError(response, 502, "AI_UNAVAILABLE");
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it("maps a repeated timeout to 504 AI_TIMEOUT", async () => {
    adapter.mockRejectedValue(new APIConnectionTimeoutError({ message: "secret internal detail" }));
    const response = await POST(jsonRequest({ topic: "x" }));
    expect(await response.clone().text()).not.toContain("secret internal detail");
    await expectError(response, 504, "AI_TIMEOUT");
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it("uses the last failure for the final code (network error, then timeout → 504)", async () => {
    adapter
      .mockRejectedValueOnce(new APIConnectionError({ message: "x" }))
      .mockRejectedValueOnce(new APIConnectionTimeoutError());
    await expectError(await POST(jsonRequest({ topic: "x" })), 504, "AI_TIMEOUT");
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it("maps a repeated empty response to 502", async () => {
    modelReturns("   ");
    await expectError(await POST(jsonRequest({ topic: "x" })), 502, "AI_UNAVAILABLE");
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it("maps a repeated incomplete response to 502", async () => {
    modelReturns("half a jo", { status: "incomplete" });
    await expectError(await POST(jsonRequest({ topic: "x" })), 502, "AI_UNAVAILABLE");
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["network error", () => new APIConnectionError({ message: "x" })],
    ["timeout", () => new APIConnectionTimeoutError()],
    ["OpenAI 5xx", () => new InternalServerError(500, {}, "x", headers)],
    ["OpenAI 429", () => new RateLimitError(429, { code: "rate_limit_exceeded" }, "x", headers)],
  ])("retries once after a %s and returns the second result", async (_name, makeError) => {
    adapter.mockRejectedValueOnce(makeError()).mockResolvedValueOnce(GOOD);
    const response = await POST(jsonRequest({ topic: "x" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ joke: "a joke" });
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it("retries once after an empty response", async () => {
    adapter.mockResolvedValueOnce({ status: "completed", text: "", refused: false }).mockResolvedValueOnce(GOOD);
    expect((await POST(jsonRequest({ topic: "x" }))).status).toBe(200);
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it("does not retry a refusal on the second attempt", async () => {
    adapter
      .mockRejectedValueOnce(new APIConnectionError({ message: "x" }))
      .mockResolvedValueOnce({ status: "completed", text: "[[REFUSED]]", refused: false });
    await expectError(await POST(jsonRequest({ topic: "x" })), 422, "TOPIC_REFUSED");
    expect(adapter).toHaveBeenCalledTimes(2);
  });
});
