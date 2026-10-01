import { error, json } from "@sveltejs/kit";
import { notFound, requireDb, requireUser } from "$lib/server/http";
import { copySharedList, getSharedList } from "$lib/server/repositories/sharing";
import type { RequestHandler } from "./$types";

/** "Kopieer naar mijn lijsten" for logged-in users who do not own the list. */
export const POST: RequestHandler = async ({ platform, locals, params }) => {
  const user = requireUser(locals);
  const db = requireDb(platform);
  const shared = await getSharedList(db, params.slug);
  if (!shared) notFound();
  if (shared.ownerId === user.id) error(400, "Dit is al jouw lijst.");
  return json(await copySharedList(db, user.id, shared), { status: 201 });
};
