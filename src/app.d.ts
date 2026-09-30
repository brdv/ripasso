// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { D1Database } from "@cloudflare/workers-types";
import type { Auth } from "$lib/server/auth";

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: { id: string; email: string } | null;
			auth?: Auth;
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				DB: D1Database;
				BETTER_AUTH_SECRET: string;
				BETTER_AUTH_URL: string;
			};
		}
	}
}

export {};
