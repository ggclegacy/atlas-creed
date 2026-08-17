export { auth as proxy } from "@/auth";

/** Explicit protected-route allowlist. Public auth and offline routes never enter proxy. */
export const config = {
  matcher: ["/", "/settings/:path*"],
};
