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

  // Secure defaults. Expanded in Phase 1 alongside auth and CSP.
  poweredByHeader: false,

  headers: () =>
    Promise.resolve([
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ]),
};

export default nextConfig;
