"use client";

import { Archive, ArrowDown, Copy, Send, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { AtlasMarkdown } from "@/components/atlas/markdown";
import { archiveConversationAction } from "@/app/(atlas)/actions";
import type { AtlasStreamEvent } from "@/lib/conversation/stream";

export interface ConversationMessage {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly text: string;
  readonly status:
    "pending" | "streaming" | "completed" | "interrupted" | "failed";
  readonly errorCode?: string | null;
}

function readEvents(buffer: string): {
  events: AtlasStreamEvent[];
  remainder: string;
} {
  const chunks = buffer.split("\n\n");
  const remainder = chunks.pop() ?? "";
  const events: AtlasStreamEvent[] = [];
  for (const chunk of chunks) {
    const data = chunk
      .split("\n")
      .find((line) => line.startsWith("data: "))
      ?.slice(6);
    if (!data) continue;
    try {
      const parsed = JSON.parse(data) as AtlasStreamEvent;
      if (parsed.version === 1 && typeof parsed.sequence === "number") {
        events.push(parsed);
      }
    } catch {
      // Ignore a malformed frame; terminal absence still produces a visible error.
    }
  }
  return { events, remainder };
}

function subscribeToOnlineStatus(onStoreChange: () => void): () => void {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function readOnlineStatus(): boolean {
  return navigator.onLine;
}

function readServerOnlineStatus(): boolean {
  return true;
}

export function ConversationView({
  initialConversationId,
  initialMessages,
}: {
  initialConversationId?: string;
  initialMessages: ConversationMessage[];
}) {
  const router = useRouter();
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState<
    "receiving" | "thinking" | "responding" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [dailyWarning, setDailyWarning] = useState(false);
  const [nearBottom, setNearBottom] = useState(true);
  const online = useSyncExternalStore(
    subscribeToOnlineStatus,
    readOnlineStatus,
    readServerOnlineStatus,
  );
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<HTMLDivElement>(null);
  const lastSequenceRef = useRef(0);

  const draftKey = `atlas:draft:${conversationId ?? "new"}`;
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDraft(window.localStorage.getItem(draftKey) ?? "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [draftKey]);
  useEffect(() => {
    window.localStorage.setItem(draftKey, draft);
  }, [draft, draftKey]);
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 208)}px`;
  }, [draft]);

  useEffect(() => {
    if (nearBottom) latestRef.current?.scrollIntoView({ block: "end" });
  }, [messages, nearBottom, status]);

  const updateAssistant = useCallback(
    (
      id: string,
      updater: (message: ConversationMessage) => ConversationMessage,
    ) => {
      setMessages((current) =>
        current.map((message) =>
          message.id === id ? updater(message) : message,
        ),
      );
    },
    [],
  );

  async function sendMessage() {
    const text = draft.trim();
    if (!text || generating || !online || text.length > 32_000) return;
    const clientTurnId = crypto.randomUUID();
    const optimisticUserId = `user:${clientTurnId}`;
    const optimisticAssistantId = `assistant:${clientTurnId}`;
    setMessages((current) => [
      ...current,
      { id: optimisticUserId, role: "user", text, status: "completed" },
      {
        id: optimisticAssistantId,
        role: "assistant",
        text: "",
        status: "pending",
      },
    ]);
    setDraft("");
    setGenerating(true);
    setStatus("receiving");
    setError(null);
    setNearBottom(true);
    lastSequenceRef.current = 0;
    const abortController = new AbortController();
    abortRef.current = abortController;
    let assistantId = optimisticAssistantId;
    let terminal = false;
    try {
      const response = await fetch("/api/conversations/turns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(conversationId ? { conversationId } : {}),
          clientTurnId,
          text,
        }),
        signal: abortController.signal,
      });
      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new Error(
          payload?.error?.message ?? "Atlas could not start this turn.",
        );
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const parsed = readEvents(buffer);
        buffer = parsed.remainder;
        for (const event of parsed.events) {
          if (event.sequence <= lastSequenceRef.current) continue;
          lastSequenceRef.current = event.sequence;
          if (event.type === "turn.started") {
            assistantId = event.assistantMessageId;
            setDailyWarning(event.dailyUsageWarning);
            setMessages((current) =>
              current.map((message) =>
                message.id === optimisticAssistantId
                  ? { ...message, id: event.assistantMessageId }
                  : message,
              ),
            );
            if (!conversationId) {
              setConversationId(event.conversationId);
              window.history.replaceState(
                null,
                "",
                `/c/${event.conversationId}`,
              );
            }
          } else if (event.type === "assistant.status") {
            setStatus(event.status);
            updateAssistant(assistantId, (message) => ({
              ...message,
              status:
                event.status === "responding" ? "streaming" : message.status,
            }));
          } else if (event.type === "assistant.text.delta") {
            updateAssistant(assistantId, (message) => ({
              ...message,
              text: message.text + event.text,
              status: "streaming",
            }));
          } else if (event.type === "assistant.completed") {
            terminal = true;
            updateAssistant(assistantId, (message) => ({
              ...message,
              status: "completed",
            }));
          } else if (event.type === "assistant.interrupted") {
            terminal = true;
            updateAssistant(assistantId, (message) => ({
              ...message,
              status: "interrupted",
            }));
          } else if (event.type === "turn.error") {
            terminal = true;
            setError(event.message);
            updateAssistant(assistantId, (message) => ({
              ...message,
              status: "failed",
            }));
          }
        }
        if (done) break;
      }
      if (!terminal)
        throw new Error("The response stream ended before it was finalized.");
    } catch (caught) {
      const stopped = abortController.signal.aborted;
      if (stopped) {
        updateAssistant(assistantId, (message) => ({
          ...message,
          status: "interrupted",
        }));
      } else {
        const message =
          caught instanceof Error
            ? caught.message
            : "The turn could not be completed.";
        setError(message);
        setDraft((current) => current || text);
        updateAssistant(assistantId, (item) => ({ ...item, status: "failed" }));
      }
    } finally {
      abortRef.current = null;
      setGenerating(false);
      setStatus(null);
      router.refresh();
      textareaRef.current?.focus();
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && generating) stop();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [generating]);

  const sendDisabled =
    !draft.trim() || generating || !online || draft.length > 32_000;
  return (
    <main className="relative flex h-[calc(100dvh-4rem)] min-h-0 flex-col md:h-dvh">
      {initialConversationId ? (
        <form
          action={archiveConversationAction.bind(null, initialConversationId)}
          onSubmit={(event) => {
            if (!window.confirm("Archive this conversation?")) {
              event.preventDefault();
            }
          }}
          className="absolute top-3 right-3 z-10"
        >
          <button
            type="submit"
            disabled={generating}
            aria-label="Archive conversation"
            title="Archive conversation"
            className="flex size-11 items-center justify-center rounded-inline border border-border-hairline bg-surface-base/90 text-text-tertiary backdrop-blur-sm hover:bg-[var(--state-hover)] hover:text-text-primary disabled:opacity-40"
          >
            <Archive className="size-4" strokeWidth={1.6} />
          </button>
        </form>
      ) : null}
      <div
        ref={scrollerRef}
        onScroll={(event) => {
          const element = event.currentTarget;
          setNearBottom(
            element.scrollHeight - element.scrollTop - element.clientHeight <
              160,
          );
        }}
        className="relative flex-1 overflow-y-auto overscroll-contain px-5 sm:px-8"
      >
        <div className="mx-auto flex min-h-full w-full max-w-[68ch] flex-col justify-end pt-12 pb-8 sm:pt-16">
          {messages.length === 0 ? (
            <p className="mb-10 text-[length:var(--text-size-lead)] text-text-secondary">
              What are we thinking through?
            </p>
          ) : null}
          <section aria-label="Conversation" className="space-y-10">
            {messages.map((message) =>
              message.role === "user" ? (
                <article
                  key={message.id}
                  className="max-w-[60ch] border-l-2 border-accent-authority bg-surface-raised px-5 py-4 text-[1rem] leading-7 text-text-primary"
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                </article>
              ) : message.text || message.status === "failed" ? (
                <article
                  key={message.id}
                  className="atlas-prose text-[1rem] leading-[1.625] text-text-primary"
                >
                  <AtlasMarkdown>{message.text}</AtlasMarkdown>
                  {message.status === "streaming" ? (
                    <span
                      className="ml-1 inline-block h-[1.05em] w-px animate-pulse bg-accent-authority align-[-.15em]"
                      aria-hidden="true"
                    />
                  ) : null}
                  {message.status === "interrupted" ||
                  message.status === "failed" ? (
                    <div className="mt-4 flex items-center gap-3 border-t border-border-hairline pt-3 font-mono text-[length:var(--text-size-label)] tracking-[var(--text-tracking-label)] text-text-tertiary uppercase">
                      <span>{message.status}</span>
                      {message.text ? (
                        <button
                          type="button"
                          onClick={() =>
                            void navigator.clipboard.writeText(message.text)
                          }
                          className="flex min-h-11 items-center gap-1.5 px-1 hover:text-text-primary"
                        >
                          <Copy className="size-3.5" /> Copy
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ) : null,
            )}
          </section>
          {status ? (
            <div
              className="mt-7 flex items-center gap-3"
              role="status"
              aria-live="polite"
            >
              <span className="h-px w-8 bg-accent-cognition motion-safe:animate-pulse" />
              <span className="font-mono text-[length:var(--text-size-label)] tracking-[var(--text-tracking-label)] text-accent-cognition uppercase">
                {status}
              </span>
            </div>
          ) : null}
          {error ? (
            <p className="mt-5 text-[.9rem] text-signal-critical" role="alert">
              {error}
            </p>
          ) : null}
          {dailyWarning ? (
            <p className="mt-5 text-[.8rem] text-text-tertiary">
              Today&apos;s Atlas usage has crossed the configured soft warning.
            </p>
          ) : null}
          <div ref={latestRef} className="h-px" />
        </div>
        {!nearBottom ? (
          <button
            type="button"
            onClick={() => {
              latestRef.current?.scrollIntoView({ behavior: "smooth" });
              setNearBottom(true);
            }}
            className="sticky bottom-3 left-1/2 z-10 mx-auto flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-full border border-border-subtle bg-surface-overlay px-4 text-[.85rem] text-text-secondary shadow-lg"
          >
            <ArrowDown className="size-4" /> Return to latest
          </button>
        ) : null}
      </div>

      <div className="border-t border-border-hairline bg-surface-base px-4 pt-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:px-8">
        <form
          className="mx-auto flex w-full max-w-[68ch] items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage();
          }}
        >
          <label className="sr-only" htmlFor="atlas-composer">
            Message Atlas
          </label>
          <textarea
            ref={textareaRef}
            id="atlas-composer"
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                void sendMessage();
              }
            }}
            placeholder={online ? "Message Atlas" : "Offline — draft preserved"}
            className="min-h-12 max-h-52 flex-1 resize-none overflow-y-auto rounded-surface border border-border-subtle bg-surface-raised px-4 py-3 text-[1rem] leading-6 text-text-primary outline-none placeholder:text-text-tertiary focus:border-border-emphasis"
          />
          <button
            type={generating ? "button" : "submit"}
            onClick={generating ? stop : undefined}
            disabled={generating ? false : sendDisabled}
            className="flex size-12 shrink-0 items-center justify-center rounded-inline bg-accent-authority text-surface-void transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
            aria-label={generating ? "Stop generation" : "Send message"}
          >
            {generating ? (
              <Square className="size-4 fill-current" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-[68ch] text-right font-mono text-[.65rem] tracking-wide text-text-tertiary">
          {draft.length > 32_000
            ? "Message exceeds 32,000 characters"
            : "⌘/Ctrl + Enter to send"}
        </p>
      </div>
    </main>
  );
}
