"use client";

import { Check, Copy } from "lucide-react";
import { isValidElement, type ReactNode, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

function plainText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(plainText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return plainText(node.props.children);
  }
  return "";
}

function CodeFrame({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const code = plainText(children).replace(/\n$/, "");
  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  }
  return (
    <div className="my-6 overflow-hidden rounded-surface border border-border-subtle bg-surface-raised">
      <div className="flex min-h-11 items-center justify-between border-b border-border-hairline px-3">
        <span className="font-mono text-[length:var(--text-size-label)] tracking-[var(--text-tracking-label)] text-text-tertiary uppercase">
          Code
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          className="flex min-h-11 items-center gap-2 px-2 text-[length:var(--text-size-compact)] text-text-secondary hover:text-text-primary"
          aria-label="Copy code"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[.875rem] leading-6">
        {children}
      </pre>
    </div>
  );
}

export function AtlasMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      skipHtml
      components={{
        a: ({ href, children: linkChildren }) => {
          const external =
            href?.startsWith("http://") || href?.startsWith("https://");
          return (
            <a
              href={href}
              className="text-text-accent underline decoration-border-emphasis underline-offset-4 hover:text-accent-authority"
              {...(external
                ? { target: "_blank", rel: "noreferrer noopener" }
                : {})}
            >
              {linkChildren}
            </a>
          );
        },
        blockquote: ({ children: quoteChildren }) => (
          <blockquote className="my-5 border-l border-border-emphasis pl-5 text-text-secondary">
            {quoteChildren}
          </blockquote>
        ),
        code: ({ children: codeChildren, className }) =>
          className ? (
            <code className={`${className} font-mono`}>{codeChildren}</code>
          ) : (
            <code className="rounded-inline bg-surface-raised px-1.5 py-0.5 font-mono text-[.9em] text-text-primary">
              {codeChildren}
            </code>
          ),
        pre: ({ children: preChildren }) => (
          <CodeFrame>{preChildren}</CodeFrame>
        ),
        table: ({ children: tableChildren }) => (
          <div className="my-6 overflow-x-auto border-y border-border-hairline">
            <table className="w-full min-w-max border-collapse text-left text-[.9rem]">
              {tableChildren}
            </table>
          </div>
        ),
        th: ({ children: cellChildren }) => (
          <th className="border-b border-border-emphasis px-3 py-2 font-medium">
            {cellChildren}
          </th>
        ),
        td: ({ children: cellChildren }) => (
          <td className="border-b border-border-hairline px-3 py-2 align-top">
            {cellChildren}
          </td>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
