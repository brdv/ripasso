import { json } from "@sveltejs/kit";
import { notFound, requireDb, requireUser } from "$lib/server/http";
import { createListStore } from "$lib/server/repositories/lists";
import type { RequestHandler } from "./$types";

/** "Deel lijst": makes the list unlisted and returns its share slug. */
export const POST: RequestHandler = async ({ platform, locals, params }) => {
  const user = requireUser(locals);
  const shareSlug = await createListStore(requireDb(platform)).share(user.id, params.id);
  if (!shareSlug) notFound();
  return json({ shareSlug });
};

/** "Stop met delen": makes the list private again and clears the slug. */
export const DELETE: RequestHandler = async ({ platform, locals, params }) => {
  const user = requireUser(locals);
  if (!(await createListStore(requireDb(platform)).unshare(user.id, params.id))) notFound();
  return new Response(null, { status: 204 });
};
