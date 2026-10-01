import type { D1Database } from "@cloudflare/workers-types";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { dev } from "$app/environment";
import { MIN_PASSWORD_LENGTH } from "$lib/domain/constants";
import { getRequestEvent } from "$app/server";
import { getDb } from "./db";
import { account, session, user, verification } from "./db/schema";
import { trustedOrigins } from "./trusted-origins";

export { MIN_PASSWORD_LENGTH } from "$lib/domain/constants";

export interface AuthEnv {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
}

export function createAuth(env: AuthEnv) {
  return betterAuth({
    database: drizzleAdapter(getDb(env.DB), {
      provider: "sqlite",
      schema: { user, session, account, verification },
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: trustedOrigins(env.BETTER_AUTH_URL, env.BETTER_AUTH_TRUSTED_ORIGINS, dev),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      autoSignIn: true,
    },
    plugins: [sveltekitCookies(getRequestEvent)],
  });
}

export type Auth = ReturnType<typeof createAuth>;
