import { json } from "@sveltejs/kit";
import { notFound, requireDb } from "$lib/server/http";
import { getSharedList } from "$lib/server/repositories/sharing";
import type { RequestHandler } from "./$types";

/** A shared list and its entries, readable by anyone with the link. */
export const GET: RequestHandler = async ({ platform, locals, params }) => {
  const shared = await getSharedList(requireDb(platform), params.slug);
  if (!shared) notFound();
  return json({
    list: shared.list,
    entries: shared.entries,
    isOwner: locals.user?.id === shared.ownerId,
  });
};
