import { generateJoke, type JokeErrorCode } from "@/lib/server/jokeService";
import {
  MAX_BODY_BYTES,
  MAX_PREVIOUS_JOKE_LENGTH,
  MAX_TOPIC_LENGTH,
  countChars,
} from "@/lib/topic";

export const runtime = "nodejs";
export const maxDuration = 60;

type ErrorCode = JokeErrorCode | "INVALID_INPUT" | "PAYLOAD_TOO_LARGE";

const STATUS: Record<ErrorCode, number> = {
  INVALID_INPUT: 400,
  PAYLOAD_TOO_LARGE: 413,
  TOPIC_REFUSED: 422,
  AI_UNAVAILABLE: 502,
  SERVICE_UNAVAILABLE: 503,
  AI_TIMEOUT: 504,
};

const HEADERS = { "Cache-Control": "no-store" };

function errorResponse(code: ErrorCode): Response {
  return Response.json({ error: { code } }, { status: STATUS[code], headers: HEADERS });
}

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return errorResponse("INVALID_INPUT");
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (declaredLength > MAX_BODY_BYTES) return errorResponse("PAYLOAD_TOO_LARGE");

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return errorResponse("PAYLOAD_TOO_LARGE");

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return errorResponse("INVALID_INPUT");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return errorResponse("INVALID_INPUT");
  }

  const { topic = "", previousJoke } = body as Record<string, unknown>;
  if (typeof topic !== "string") return errorResponse("INVALID_INPUT");
  if (previousJoke !== undefined && typeof previousJoke !== "string") {
    return errorResponse("INVALID_INPUT");
  }
  if (countChars(topic) > MAX_TOPIC_LENGTH) return errorResponse("INVALID_INPUT");
  if (previousJoke !== undefined && countChars(previousJoke) > MAX_PREVIOUS_JOKE_LENGTH) {
    return errorResponse("INVALID_INPUT");
  }

  const result = await generateJoke({
    topic: topic.trim(),
    previousJoke: previousJoke?.trim() || undefined,
  });
  if (!result.ok) return errorResponse(result.code);
  return Response.json({ joke: result.joke }, { headers: HEADERS });
}
