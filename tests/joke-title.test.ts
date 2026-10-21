import { describe, expect, it } from "vitest";
import { jokeCardTopic } from "@/app/jokeTitle";

describe("jokeCardTopic", () => {
  it("returns null for an empty or whitespace-only topic", () => {
    expect(jokeCardTopic("")).toBeNull();
    expect(jokeCardTopic("   ")).toBeNull();
  });

  it("returns a short topic as is (trimmed)", () => {
    expect(jokeCardTopic(" חתולים ")).toBe("חתולים");
  });

  it("keeps a topic of exactly 40 characters", () => {
    const topic = "א".repeat(40);
    expect(jokeCardTopic(topic)).toBe(topic);
  });

  it("shortens a topic longer than 40 characters with an ellipsis", () => {
    expect(jokeCardTopic("א".repeat(41))).toBe("א".repeat(40) + "…");
  });

  it("counts emoji as single characters and never splits them", () => {
    const topic = "😂".repeat(45);
    expect(jokeCardTopic(topic)).toBe("😂".repeat(40) + "…");
  });
});
