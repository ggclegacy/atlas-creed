"use client";

import { History, LogOut, Menu, Plus, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { signOutOwner } from "@/app/(atlas)/actions";
import { AtlasMark } from "@/components/brand/atlas-mark";

interface ConversationNavItem {
  readonly id: string;
  readonly title: string;
  readonly lastMessageAt: string;
}

function ConversationHistory({
  conversations,
  close,
}: {
  conversations: ConversationNavItem[];
  close?: () => void;
}) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-16 items-center justify-between border-b border-border-hairline px-4">
        <p className="font-mono text-[length:var(--text-size-label)] tracking-[var(--text-tracking-label)] text-text-tertiary uppercase">
          Conversations
        </p>
        <Link
          href="/"
          {...(close ? { onClick: close } : {})}
          className="flex size-11 min-h-11 min-w-11 shrink-0 items-center justify-center rounded-inline text-text-secondary hover:bg-[var(--state-hover)] hover:text-text-primary"
          aria-label="New conversation"
          title="New conversation"
        >
          <Plus className="size-[1.125rem]" strokeWidth={1.6} />
        </Link>
      </div>
      <nav
        className="min-h-0 flex-1 overflow-y-auto px-2 py-3"
        aria-label="Recent conversations"
      >
        {conversations.length ? (
          <ul className="space-y-1">
            {conversations.map((conversation) => {
              const href = `/c/${conversation.id}`;
              const active = pathname === href;
              return (
                <li key={conversation.id}>
                  <Link
                    href={href}
                    {...(close ? { onClick: close } : {})}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-inline px-3 py-2.5 transition-colors ${
                      active
                        ? "bg-[var(--state-selected)] text-text-primary"
                        : "text-text-secondary hover:bg-[var(--state-hover)] hover:text-text-primary"
                    }`}
                  >
                    <span className="block truncate text-[.875rem]">
                      {conversation.title}
                    </span>
                    <span className="mt-1 block font-mono text-[.65rem] tracking-wide text-text-tertiary">
                      {conversation.lastMessageAt.slice(0, 10)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-3 py-4 text-[.82rem] leading-5 text-text-tertiary">
            Conversations appear after the first message.
          </p>
        )}
      </nav>
    </div>
  );
}

export function AtlasShell({
  children,
  conversations,
  ownerEmail,
}: {
  children: React.ReactNode;
  conversations: ConversationNavItem[];
  ownerEmail: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const settingsActive = pathname.startsWith("/settings");

  return (
    <div className="min-h-dvh bg-surface-base">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col border-r border-border-hairline bg-surface-void md:flex">
        <Link
          href="/"
          className="flex h-16 items-center justify-center border-b border-border-hairline"
          aria-label="New Atlas conversation"
        >
          <AtlasMark className="size-7 text-accent-authority" />
        </Link>
        <nav
          className="flex flex-1 flex-col items-center gap-2 px-2 py-4"
          aria-label="Primary"
        >
          <Link
            href="/"
            aria-label="New conversation"
            title="New conversation"
            className="flex size-11 items-center justify-center rounded-inline text-text-tertiary hover:bg-[var(--state-hover)] hover:text-text-primary"
          >
            <Plus className="size-[1.125rem]" strokeWidth={1.6} />
          </Link>
          <button
            type="button"
            onClick={() => setHistoryOpen((open) => !open)}
            aria-label="Conversation history"
            aria-expanded={historyOpen}
            title="Conversation history"
            className={`flex size-11 items-center justify-center rounded-inline ${historyOpen ? "bg-[var(--state-selected)] text-text-accent" : "text-text-tertiary hover:bg-[var(--state-hover)] hover:text-text-primary"}`}
          >
            <History className="size-[1.125rem]" strokeWidth={1.6} />
          </button>
          <Link
            href="/settings"
            aria-label="Settings"
            title="Settings"
            aria-current={settingsActive ? "page" : undefined}
            className={`mt-auto flex size-11 items-center justify-center rounded-inline ${settingsActive ? "bg-[var(--state-selected)] text-text-accent" : "text-text-tertiary hover:bg-[var(--state-hover)] hover:text-text-primary"}`}
          >
            <Settings className="size-[1.125rem]" strokeWidth={1.6} />
          </Link>
        </nav>
      </aside>

      {historyOpen ? (
        <>
          <button
            type="button"
            aria-label="Close conversation history"
            className="fixed inset-0 z-30 hidden bg-surface-void/35 md:block"
            onClick={() => setHistoryOpen(false)}
          />
          <aside className="fixed inset-y-0 left-16 z-40 hidden w-80 flex-col border-r border-border-subtle bg-surface-raised shadow-overlay md:flex">
            <ConversationHistory
              conversations={conversations}
              close={() => setHistoryOpen(false)}
            />
          </aside>
        </>
      ) : null}

      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-border-hairline bg-surface-base/95 px-3 [padding-top:env(safe-area-inset-top)] backdrop-blur-sm md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          className="flex size-11 items-center justify-center rounded-inline text-text-secondary hover:bg-[var(--state-hover)] hover:text-text-primary"
        >
          <Menu className="size-5" strokeWidth={1.6} />
        </button>
        <Link href="/" aria-label="New Atlas conversation">
          <AtlasMark className="size-7 text-accent-authority" />
        </Link>
        <Link
          href="/"
          aria-label="New conversation"
          className="flex size-11 min-h-11 min-w-11 shrink-0 items-center justify-center text-text-secondary"
        >
          <Plus className="size-5" strokeWidth={1.6} />
        </Link>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-surface-void/80"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
          <aside className="relative flex h-full w-[min(21rem,88vw)] flex-col border-r border-border-subtle bg-surface-raised pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] shadow-overlay">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute top-[max(.625rem,env(safe-area-inset-top))] right-2 z-10 flex size-11 items-center justify-center rounded-inline text-text-secondary hover:bg-[var(--state-hover)] hover:text-text-primary"
            >
              <X className="size-5" strokeWidth={1.6} />
            </button>
            <ConversationHistory
              conversations={conversations}
              close={() => setMobileOpen(false)}
            />
            <div className="border-t border-border-hairline p-3">
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex min-h-11 items-center gap-3 px-3 text-[.875rem] text-text-secondary hover:text-text-primary"
              >
                <Settings className="size-4" /> Settings
              </Link>
              <form action={signOutOwner}>
                <button
                  type="submit"
                  className="flex min-h-11 w-full items-center gap-3 px-3 text-left text-[.875rem] text-text-secondary hover:text-text-primary"
                >
                  <LogOut className="size-4" /> Sign out
                </button>
              </form>
              <p className="truncate px-3 pt-2 text-[.68rem] text-text-tertiary">
                {ownerEmail}
              </p>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="min-h-[calc(100dvh-4rem)] md:ml-16 md:min-h-dvh">
        {children}
      </div>
    </div>
  );
}
