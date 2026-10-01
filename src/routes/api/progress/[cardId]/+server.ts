import { error, json } from "@sveltejs/kit";
import { isProgressEntry } from "$lib/domain/progress";
import { readJson, requireDb, requireUser } from "$lib/server/http";
import { createProgressStore } from "$lib/server/repositories/progress";
import type { RequestHandler } from "./$types";

export const PUT: RequestHandler = async ({ platform, locals, params, request }) => {
  const user = requireUser(locals);
  const entry = await readJson(request);
  if (!params.cardId.startsWith("card:") || !isProgressEntry(entry)) error(400, "Ongeldige voortgang.");
  await createProgressStore(requireDb(platform)).put(user.id, params.cardId, entry);
  return json(entry);
};
