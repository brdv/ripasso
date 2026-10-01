/**
 * Origins allowed to send auth requests: the app's own URL, any extra origins from the
 * comma-separated `BETTER_AUTH_TRUSTED_ORIGINS` (wildcards allowed, e.g.
 * `https://*.ripasso.pages.dev` for preview deployments), and the local dev server.
 */
export function trustedOrigins(baseUrl: string, extra: string | undefined, dev: boolean): string[] {
  const configured = (extra ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  // In development the app is reached as both localhost and 127.0.0.1 (Playwright).
  const devOrigins = dev ? ["http://localhost:5173", "http://127.0.0.1:5173"] : [];
  return [baseUrl, ...configured, ...devOrigins];
}
