// Browser-side client for POST /api/jokes.

export type ErrorKind = "refused" | "rateLimited" | "timeout" | "offline" | "invalid" | "general";

export type JokeResponse = { ok: true; joke: string } | { ok: false; kind: ErrorKind };

// Browser ceiling above the server's ~30s total (two 15s attempts); no retry on the client.
export const CLIENT_TIMEOUT_MS = 35_000;

function kindForStatus(status: number): ErrorKind {
  // 429 may come from the Vercel WAF without a JSON body, so only the status is used.
  if (status === 429) return "rateLimited";
  if (status === 422) return "refused";
  if (status === 504) return "timeout";
  if (status === 400 || status === 413) return "invalid";
  return "general";
}

export async function requestJoke(topic: string, previousJoke?: string): Promise<JokeResponse> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { ok: false, kind: "offline" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  try {
    const response = await fetch("/api/jokes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(previousJoke ? { topic, previousJoke } : { topic }),
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, kind: kindForStatus(response.status) };

    const data: unknown = await response.json();
    const joke = (data as { joke?: unknown })?.joke;
    if (typeof joke !== "string" || !joke.trim()) return { ok: false, kind: "general" };
    return { ok: true, joke };
  } catch (error) {
    if (controller.signal.aborted) return { ok: false, kind: "timeout" };
    // fetch rejects with a TypeError when the network is unreachable.
    if (error instanceof TypeError) return { ok: false, kind: "offline" };
    return { ok: false, kind: "general" };
  } finally {
    clearTimeout(timer);
  }
}
