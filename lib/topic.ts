// Shared input limits and character counting, used by both the UI and the API.

export const MAX_TOPIC_LENGTH = 100;
export const MAX_PREVIOUS_JOKE_LENGTH = 1000;
export const MAX_BODY_BYTES = 4096;

// Counts code points after trimming, so an emoji counts as one character on both sides.
export function countChars(value: string): number {
  return Array.from(value.trim()).length;
}

// Keeps UI input within the topic limit (e.g. when pasting long text).
export function clampTopic(value: string): string {
  if (countChars(value) <= MAX_TOPIC_LENGTH) return value;
  const leading = value.length - value.trimStart().length;
  return value.slice(0, leading) + Array.from(value.trimStart()).slice(0, MAX_TOPIC_LENGTH).join("");
}
