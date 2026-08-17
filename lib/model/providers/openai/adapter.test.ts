import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { textContent } from "../../../conversation/content";
import type { AtlasEvent } from "../../types";
import { OpenAIAtlasModel } from "./adapter";

async function* successfulEvents() {
  await Promise.resolve();
  yield { type: "response.created", response: { id: "resp_1" } };
  yield { type: "response.output_text.delta", delta: "Hello" };
  yield {
    type: "response.completed",
    response: {
      id: "resp_1",
      status: "completed",
      usage: {
        input_tokens: 10,
        input_tokens_details: { cached_tokens: 4, cache_write_tokens: 2 },
        output_tokens: 5,
        output_tokens_details: { reasoning_tokens: 1 },
        total_tokens: 15,
      },
    },
  };
}

describe("OpenAI Responses adapter", () => {
  it("normalizes streaming events and sends stateless request semantics", async () => {
    const create = vi.fn((_body: unknown, _options: unknown) => ({
      withResponse: () =>
        Promise.resolve({ data: successfulEvents(), request_id: "req_1" }),
    }));
    const client = { responses: { create } } as never;
    const model = new OpenAIAtlasModel("sk-test", "gpt-5.6-sol", client);
    const events: AtlasEvent[] = [];
    for await (const event of model.stream(
      {
        instructions: ["Identity"],
        messages: [{ role: "user", content: textContent("Hi") }],
        maxOutputTokens: 100,
        reasoning: "low",
      },
      new AbortController().signal,
    )) {
      events.push(event);
    }
    expect(events).toEqual([
      { type: "generation_started", requestId: "req_1", responseId: "resp_1" },
      { type: "text_delta", text: "Hello" },
      {
        type: "usage",
        usage: {
          inputTokens: 10,
          outputTokens: 5,
          cachedInputTokens: 4,
          cacheWriteInputTokens: 2,
          reasoningTokens: 1,
          totalTokens: 15,
        },
      },
      { type: "completed", finishReason: "completed", responseId: "resp_1" },
    ]);
    expect(create.mock.calls[0]?.[0]).toMatchObject({
      model: "gpt-5.6-sol",
      store: false,
      stream: true,
      reasoning: { effort: "low" },
    });
    expect(create.mock.calls[0]?.[1]).toMatchObject({
      signal: expect.any(AbortSignal) as AbortSignal,
    });
  });

  it("maps structured output without leaking provider response types", async () => {
    const parse = vi.fn((_body: unknown, _options: unknown) => ({
      withResponse: () =>
        Promise.resolve({
          request_id: "req_title",
          data: {
            id: "resp_title",
            status: "completed",
            output_parsed: { title: "Launch Readiness" },
            usage: null,
          },
        }),
    }));
    const model = new OpenAIAtlasModel("sk-test", "gpt-5.6-terra", {
      responses: { parse },
    } as never);
    const result = await model.structured(
      {
        instructions: ["Title it"],
        messages: [{ role: "user", content: textContent("Launch") }],
        maxOutputTokens: 64,
        reasoning: "none",
        schema: z.object({ title: z.string() }),
        schemaName: "title",
      },
      new AbortController().signal,
    );
    expect(result.value).toEqual({ title: "Launch Readiness" });
    expect(parse.mock.calls[0]?.[0]).toMatchObject({
      store: false,
      reasoning: { effort: "none" },
    });
  });

  it("normalizes a failed response with a safe diagnostic code", async () => {
    async function* failedEvents() {
      await Promise.resolve();
      yield { type: "response.created", response: { id: "resp_failed" } };
      yield {
        type: "response.failed",
        response: {
          id: "resp_failed",
          error: { code: "server_error", message: "private provider detail" },
        },
      };
    }
    const client = {
      responses: {
        create: () => ({
          withResponse: () =>
            Promise.resolve({ data: failedEvents(), request_id: "req_failed" }),
        }),
      },
    } as never;
    const model = new OpenAIAtlasModel("sk-test", "gpt-5.6-sol", client);

    await expect(async () => {
      for await (const _event of model.stream(
        {
          instructions: ["Identity"],
          messages: [{ role: "user", content: textContent("Hi") }],
          maxOutputTokens: 100,
          reasoning: "low",
        },
        new AbortController().signal,
      )) {
        // Drain the stream to its normalized terminal error.
      }
    }).rejects.toMatchObject({
      code: "provider_error",
      diagnosticCode: "server_error",
      retryable: true,
    });
  });

  it("rejects a stream that ends without a terminal event", async () => {
    async function* truncatedEvents() {
      await Promise.resolve();
      yield { type: "response.created", response: { id: "resp_truncated" } };
      yield { type: "response.output_text.delta", delta: "Partial" };
    }
    const client = {
      responses: {
        create: () => ({
          withResponse: () =>
            Promise.resolve({
              data: truncatedEvents(),
              request_id: "req_truncated",
            }),
        }),
      },
    } as never;
    const model = new OpenAIAtlasModel("sk-test", "gpt-5.6-sol", client);

    await expect(async () => {
      for await (const _event of model.stream(
        {
          instructions: ["Identity"],
          messages: [{ role: "user", content: textContent("Hi") }],
          maxOutputTokens: 100,
          reasoning: "low",
        },
        new AbortController().signal,
      )) {
        // Drain the deliberately truncated fixture.
      }
    }).rejects.toMatchObject({
      code: "invalid_response",
      diagnosticCode: "stream_ended_without_terminal",
    });
  });
});
