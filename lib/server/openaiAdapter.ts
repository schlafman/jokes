import OpenAI from "openai";

// The only place that talks to OpenAI. Server-side only; the key never reaches the client.

export const MODEL = "gpt-5";
const ATTEMPT_TIMEOUT_MS = 15_000;

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      // Retries are managed by our own code (see ARCHITECTURE 2.5), never by the SDK.
      maxRetries: 0,
      timeout: ATTEMPT_TIMEOUT_MS,
    });
  }
  return client;
}

export type ModelResult = {
  status: string | undefined;
  text: string;
  refused: boolean;
};

export async function createJokeResponse(params: {
  instructions: string;
  input: string;
}): Promise<ModelResult> {
  const response = await getClient().responses.create({
    model: MODEL,
    instructions: params.instructions,
    input: params.input,
    reasoning: { effort: "minimal" },
    text: { verbosity: "low" },
    max_output_tokens: 1000,
    store: false,
  });

  const refused = response.output.some(
    (item) => item.type === "message" && item.content.some((part) => part.type === "refusal"),
  );

  return { status: response.status, text: response.output_text ?? "", refused };
}
