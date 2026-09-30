import { error, json } from "@sveltejs/kit";
import { parseEntry } from "$lib/server/validation";
import { readJson, requireDb, requireUser } from "$lib/server/http";
import { createEntryStore } from "$lib/server/repositories/entries";
import type { RequestHandler } from "./$types";

/** Entries the caller may practise; `?scope=own` returns only the caller's own entries. */
export const GET: RequestHandler = async ({ platform, locals, url }) => {
  const store = createEntryStore(requireDb(platform));
  if (url.searchParams.get("scope") === "own") {
    return json(await store.listOwn(requireUser(locals).id));
  }
  return json(await store.listVisible(locals.user?.id));
};

export const POST: RequestHandler = async ({ platform, locals, request }) => {
  const user = requireUser(locals);
  const entry = parseEntry(await readJson(request));
  const created = await createEntryStore(requireDb(platform)).create(user.id, entry);
  if (!created) error(409, "Dit ID bestaat al.");
  return json(entry, { status: 201 });
};
