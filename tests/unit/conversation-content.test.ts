import { describe, expect, it } from "vitest";

import {
  atlasMessageContentSchema,
  contentText,
  parseMessageContent,
  textContent,
} from "../../lib/conversation/content";

describe("Atlas message content envelope", () => {
  it("round-trips public text in a versioned envelope", () => {
    const content = textContent("Public answer");
    expect(content).toEqual({
      version: 1,
      blocks: [{ type: "text", text: "Public answer" }],
    });
    expect(contentText(parseMessageContent(content))).toBe("Public answer");
  });

  it("rejects provider-private and unversioned shapes", () => {
    expect(() =>
      atlasMessageContentSchema.parse([{ type: "text", text: "x" }]),
    ).toThrow();
    expect(() =>
      atlasMessageContentSchema.parse({
        version: 1,
        blocks: [{ type: "reasoning", text: "private" }],
      }),
    ).toThrow();
  });
});
