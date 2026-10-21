// Topic shown in the joke card title, per the card title rules in spec/DESIGN.md.

export const MAX_TITLE_TOPIC_LENGTH = 40;

// Returns null for a general joke (no topic); long topics are shortened with an ellipsis.
export function jokeCardTopic(topic: string): string | null {
  const chars = Array.from(topic.trim());
  if (chars.length === 0) return null;
  if (chars.length <= MAX_TITLE_TOPIC_LENGTH) return chars.join("");
  return chars.slice(0, MAX_TITLE_TOPIC_LENGTH).join("") + "…";
}
