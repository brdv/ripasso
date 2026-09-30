import { error, json } from "@sveltejs/kit";
import { notFound, readJson, requireDb, requireUser } from "$lib/server/http";
import { createEntryStore } from "$lib/server/repositories/entries";
import { parseEntry } from "$lib/server/validation";
import type { RequestHandler } from "./$types";

export const PUT: RequestHandler = async ({ platform, locals, params, request }) => {
  const user = requireUser(locals);
  const entry = parseEntry(await readJson(request));
  if (entry.id !== params.id) error(400, "Het ID klopt niet.");
  if (!(await createEntryStore(requireDb(platform)).update(user.id, entry))) notFound();
  return json(entry);
};

export const DELETE: RequestHandler = async ({ platform, locals, params }) => {
  const user = requireUser(locals);
  if (!(await createEntryStore(requireDb(platform)).remove(user.id, params.id))) notFound();
  return new Response(null, { status: 204 });
};
