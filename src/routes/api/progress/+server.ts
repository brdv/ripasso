import { json } from "@sveltejs/kit";
import { requireDb, requireUser } from "$lib/server/http";
import { createProgressStore } from "$lib/server/repositories/progress";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ platform, locals }) => {
  const user = requireUser(locals);
  return json(await createProgressStore(requireDb(platform)).load(user.id));
};

export const DELETE: RequestHandler = async ({ platform, locals }) => {
  const user = requireUser(locals);
  await createProgressStore(requireDb(platform)).clear(user.id);
  return new Response(null, { status: 204 });
};
