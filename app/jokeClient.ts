// Browser-side client for POST /api/jokes.

export type JokeResponse = { ok: true; joke: string } | { ok: false; kind: "refused" | "general" };

export async function requestJoke(topic: string, previousJoke?: string): Promise<JokeResponse> {
  try {
    const response = await fetch("/api/jokes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(previousJoke ? { topic, previousJoke } : { topic }),
    });
    if (response.status === 422) return { ok: false, kind: "refused" };
    if (!response.ok) return { ok: false, kind: "general" };

    const data: unknown = await response.json();
    const joke = (data as { joke?: unknown })?.joke;
    if (typeof joke !== "string" || !joke.trim()) return { ok: false, kind: "general" };
    return { ok: true, joke };
  } catch {
    return { ok: false, kind: "general" };
  }
}
