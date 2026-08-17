"use client";

import { Home, LogOut, Menu, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { signOutOwner } from "@/app/(atlas)/actions";
import { AtlasMark } from "@/components/brand/atlas-mark";

const destinations = [
  { href: "/", label: "Atlas", icon: Home },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function RailContents({ close }: { close?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className="flex h-16 items-center justify-center border-b border-border-hairline">
        <AtlasMark className="size-7 text-accent-authority" />
        <span className="sr-only">Atlas Creed</span>
      </div>
      <nav
        className="flex flex-1 flex-col items-center gap-2 px-2 py-4"
        aria-label="Primary"
      >
        {destinations.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              {...(close ? { onClick: close } : {})}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              title={label}
              className={`flex size-11 items-center justify-center rounded-inline transition-colors duration-[var(--motion-hover)] ${
                active
                  ? "bg-[var(--state-selected)] text-text-accent"
                  : "text-text-tertiary hover:bg-[var(--state-hover)] hover:text-text-primary"
              }`}
            >
              <Icon
                aria-hidden="true"
                className="size-[1.125rem]"
                strokeWidth={1.6}
              />
            </Link>
          );
        })}
      </nav>
      <form
        action={signOutOwner}
        className="border-t border-border-hairline p-2"
      >
        <button
          type="submit"
          aria-label="Sign out"
          title="Sign out"
          className="flex size-11 items-center justify-center rounded-inline text-text-tertiary transition-colors duration-[var(--motion-hover)] hover:bg-[var(--state-hover)] hover:text-text-primary"
        >
          <LogOut
            aria-hidden="true"
            className="size-[1.125rem]"
            strokeWidth={1.6}
          />
        </button>
      </form>
    </>
  );
}

export function AtlasShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-surface-base">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col border-r border-border-hairline bg-surface-void md:flex">
        <RailContents />
      </aside>

      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-border-hairline bg-surface-base/95 px-4 [padding-top:env(safe-area-inset-top)] backdrop-blur-sm md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
          className="flex size-11 items-center justify-center rounded-inline text-text-secondary hover:bg-[var(--state-hover)] hover:text-text-primary"
        >
          <Menu aria-hidden="true" className="size-5" strokeWidth={1.6} />
        </button>
        <AtlasMark className="size-7 text-accent-authority" />
        <span className="size-11" aria-hidden="true" />
      </header>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-surface-void/80"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
          />
          <aside className="relative flex h-full w-20 flex-col border-r border-border-subtle bg-surface-raised [padding-bottom:env(safe-area-inset-bottom)] [padding-top:env(safe-area-inset-top)]">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className="absolute top-[max(.625rem,env(safe-area-inset-top))] right-[-3.5rem] flex size-11 items-center justify-center rounded-inline bg-surface-overlay text-text-primary"
            >
              <X aria-hidden="true" className="size-5" strokeWidth={1.6} />
            </button>
            <RailContents close={() => setDrawerOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="min-h-[calc(100dvh-4rem)] md:ml-16 md:min-h-dvh">
        {children}
      </div>
    </div>
  );
}
