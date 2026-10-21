import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CLIENT_TIMEOUT_MS, requestJoke } from "@/app/jokeClient";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("navigator", { onLine: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("requestJoke", () => {
  it("returns the joke on success", async () => {
    fetchMock.mockResolvedValue(Response.json({ joke: "a joke" }));
    expect(await requestJoke("x")).toEqual({ ok: true, joke: "a joke" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    [429, "rateLimited"],
    [422, "refused"],
    [504, "timeout"],
    [400, "invalid"],
    [413, "invalid"],
    [502, "general"],
    [503, "general"],
    [500, "general"],
  ])("maps HTTP %i to %s", async (status, kind) => {
    fetchMock.mockResolvedValue(Response.json({ error: { code: "X" } }, { status }));
    expect(await requestJoke("x")).toEqual({ ok: false, kind });
  });

  it("maps a WAF 429 without a JSON body to rateLimited", async () => {
    fetchMock.mockResolvedValue(new Response("Too Many Requests", { status: 429 }));
    expect(await requestJoke("x")).toEqual({ ok: false, kind: "rateLimited" });
  });

  it("maps a 200 with malformed JSON to general", async () => {
    fetchMock.mockResolvedValue(new Response("{oops", { status: 200 }));
    expect(await requestJoke("x")).toEqual({ ok: false, kind: "general" });
  });

  it("maps a network failure to offline", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await requestJoke("x")).toEqual({ ok: false, kind: "offline" });
  });

  it("reports offline without sending a request when the browser is offline", async () => {
    vi.stubGlobal("navigator", { onLine: false });
    expect(await requestJoke("x")).toEqual({ ok: false, kind: "offline" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("aborts after the browser time limit and does not retry", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("The operation was aborted.", "AbortError")),
          );
        }),
    );
    const pending = requestJoke("x");
    await vi.advanceTimersByTimeAsync(CLIENT_TIMEOUT_MS);
    expect(await pending).toEqual({ ok: false, kind: "timeout" });
    expect(CLIENT_TIMEOUT_MS).toBe(35_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
