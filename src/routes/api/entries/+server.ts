import { json } from "@sveltejs/kit";
import { getDb } from "$lib/server/db";
import { createEntryStore } from "$lib/server/repositories/entries";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ platform }) => {
  if (!platform?.env.DB) throw new Error("De database is niet beschikbaar.");
  const entries = await createEntryStore(getDb(platform.env.DB)).listVisible();
  return json(entries);
};
