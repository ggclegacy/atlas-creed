export { auth as proxy } from "@/auth";

/** Protected-route allowlist. Public auth, PWA, and offline assets bypass it. */
export const config = {
  matcher: ["/", "/c/:path*", "/settings/:path*"],
};
