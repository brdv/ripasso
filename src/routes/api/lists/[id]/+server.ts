import { error, json } from "@sveltejs/kit";
import { notFound, readJson, requireDb, requireUser } from "$lib/server/http";
import { createListStore } from "$lib/server/repositories/lists";
import { parseList } from "$lib/server/validation";
import type { RequestHandler } from "./$types";

export const PUT: RequestHandler = async ({ platform, locals, params, request }) => {
  const user = requireUser(locals);
  const list = parseList(await readJson(request));
  if (list.id !== params.id) error(400, "Het ID klopt niet.");
  if (!(await createListStore(requireDb(platform)).update(user.id, list))) notFound();
  return json(list);
};

export const DELETE: RequestHandler = async ({ platform, locals, params }) => {
  const user = requireUser(locals);
  if (!(await createListStore(requireDb(platform)).remove(user.id, params.id))) notFound();
  return new Response(null, { status: 204 });
};
