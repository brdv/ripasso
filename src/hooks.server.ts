import type { Handle } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { createAuth } from "$lib/server/auth";

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = null;
  const env = event.platform?.env;
  if (building || !env?.DB) return resolve(event);

  const auth = createAuth(env);
  event.locals.auth = auth;

  const current = await auth.api.getSession({ headers: event.request.headers });
  if (current) {
    event.locals.user = { id: current.user.id, email: current.user.email };
  }

  return svelteKitHandler({ event, resolve, auth, building });
};
