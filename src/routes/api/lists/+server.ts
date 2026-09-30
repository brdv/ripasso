import { error, json } from "@sveltejs/kit";
import { readJson, requireDb, requireUser } from "$lib/server/http";
import { createListStore } from "$lib/server/repositories/lists";
import { parseList } from "$lib/server/validation";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ platform, locals }) => {
  const user = requireUser(locals);
  return json(await createListStore(requireDb(platform)).listVisible(user.id));
};

export const POST: RequestHandler = async ({ platform, locals, request }) => {
  const user = requireUser(locals);
  const list = parseList(await readJson(request));
  if (!(await createListStore(requireDb(platform)).create(user.id, list))) {
    error(409, "Dit ID bestaat al.");
  }
  return json(list, { status: 201 });
};
