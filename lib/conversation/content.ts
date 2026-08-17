import { z } from "zod";

export const atlasTextBlockSchema = z.object({
  type: z.literal("text"),
  text: z.string().max(500_000),
});

export const atlasMessageContentSchema = z.object({
  version: z.literal(1),
  blocks: z.array(atlasTextBlockSchema).min(1),
});

export type AtlasTextBlock = z.infer<typeof atlasTextBlockSchema>;
export type AtlasMessageContent = z.infer<typeof atlasMessageContentSchema>;

export function textContent(text: string): AtlasMessageContent {
  return { version: 1, blocks: [{ type: "text", text }] };
}

export function contentText(content: AtlasMessageContent): string {
  return content.blocks.map((block) => block.text).join("");
}

export function parseMessageContent(value: unknown): AtlasMessageContent {
  return atlasMessageContentSchema.parse(value);
}
