import { createServer } from "node:http";

const port = 4010;

function usage(input = 120, output = 24) {
  return {
    input_tokens: input,
    input_tokens_details: { cached_tokens: 24, cache_write_tokens: 12 },
    output_tokens: output,
    output_tokens_details: { reasoning_tokens: 4 },
    total_tokens: input + output,
  };
}

function event(response, type, payload) {
  response.write(
    `event: ${type}\ndata: ${JSON.stringify({ type, ...payload })}\n\n`,
  );
}

const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("ok");
    return;
  }
  if (request.method !== "POST" || request.url !== "/v1/responses") {
    response.writeHead(404);
    response.end();
    return;
  }
  let raw = "";
  for await (const chunk of request) raw += chunk;
  const body = JSON.parse(raw);

  if (!body.stream) {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        id: "resp_title_fixture",
        object: "response",
        status: "completed",
        output: [
          {
            id: "msg_title_fixture",
            type: "message",
            role: "assistant",
            status: "completed",
            content: [
              {
                type: "output_text",
                text: JSON.stringify({ title: "Atlas Live Context" }),
                annotations: [],
                logprobs: [],
              },
            ],
          },
        ],
        usage: usage(80, 8),
      }),
    );
    return;
  }

  const latest = body.input?.at(-1)?.content ?? "";
  const long = String(latest).toLowerCase().includes("long response");
  const output = long
    ? "Atlas is producing a deliberately long fixture response. ".repeat(80)
    : `Atlas is live. Context messages: ${body.input?.length ?? 0}.`;
  const responseId = `resp_fixture_${Date.now()}`;
  response.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  event(response, "response.created", {
    sequence_number: 0,
    response: { id: responseId, status: "in_progress" },
  });
  const chunks = long ? (output.match(/.{1,48}/g) ?? []) : [output];
  for (const [index, delta] of chunks.entries()) {
    if (response.destroyed) return;
    event(response, "response.output_text.delta", {
      sequence_number: index + 1,
      item_id: "msg_fixture",
      output_index: 0,
      content_index: 0,
      delta,
      logprobs: [],
    });
    if (long) await new Promise((resolve) => setTimeout(resolve, 60));
  }
  event(response, "response.completed", {
    sequence_number: chunks.length + 1,
    response: {
      id: responseId,
      status: "completed",
      usage: usage(
        120 * (body.input?.length ?? 1),
        Math.ceil(output.length / 4),
      ),
    },
  });
  response.end("data: [DONE]\n\n");
});

server.listen(port, "127.0.0.1");

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
