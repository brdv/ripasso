import type { D1Database } from "@cloudflare/workers-types";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { dev } from "$app/environment";
import { MIN_PASSWORD_LENGTH } from "$lib/domain/constants";
import { getRequestEvent } from "$app/server";
import { getDb } from "./db";
import { account, session, user, verification } from "./db/schema";

export { MIN_PASSWORD_LENGTH } from "$lib/domain/constants";

export interface AuthEnv {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}

export function createAuth(env: AuthEnv) {
  // In development the app is reached as both localhost and 127.0.0.1 (Playwright).
  const devOrigins = dev ? ["http://localhost:5173", "http://127.0.0.1:5173"] : [];

  return betterAuth({
    database: drizzleAdapter(getDb(env.DB), {
      provider: "sqlite",
      schema: { user, session, account, verification },
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.BETTER_AUTH_URL, ...devOrigins],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      autoSignIn: true,
    },
    plugins: [sveltekitCookies(getRequestEvent)],
  });
}

export type Auth = ReturnType<typeof createAuth>;
