import type { NextConfig } from "next";

/**
 * Atlas Creed — Next.js configuration.
 *
 * Build Plan §2: Node runtime throughout. No Edge runtime in V1.
 * Introduce Edge only against a measured need, with an explicit decision.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Fail the production build on type errors rather than shipping them.
  // Next 16 removed the built-in `eslint` config key (its ESLint integration
  // was retired), so linting is enforced by `pnpm lint` in CI instead.
  typescript: {
    ignoreBuildErrors: false,
  },

  // Secure browser defaults. The current shell contains no private data; this
  // policy permits only Atlas-owned resources at rest.
  poweredByHeader: false,

  headers: () =>
    Promise.resolve([
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${
                process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""
              }`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self'",
              "worker-src 'self' blob:",
              "manifest-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              ...(process.env.NODE_ENV === "production"
                ? ["upgrade-insecure-requests"]
                : []),
            ].join("; "),
          },
        ],
      },
    ]),
};

export default nextConfig;
