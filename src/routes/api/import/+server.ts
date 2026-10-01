import { error, isHttpError, json } from "@sveltejs/kit";
import { isProgressEntry } from "$lib/domain/progress";
import type { PracticeList, Progress, StudyEntry } from "$lib/domain/types";
import { readJson, requireDb, requireUser } from "$lib/server/http";
import { importGuestData } from "$lib/server/repositories/import";
import { parseEntry, parseList } from "$lib/server/validation";
import type { RequestHandler } from "./$types";

/** One-time import of a guest's local entries, lists, and progress. Safe to repeat. */
export const POST: RequestHandler = async ({ platform, locals, request }) => {
  const user = requireUser(locals);
  const body = (await readJson(request)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") error(400, "Ongeldige gegevens.");

  const entries = validItems(body.entries, parseEntry);
  const lists = validItems(body.lists, parseList);
  const progress: Progress = {};
  if (body.progress && typeof body.progress === "object") {
    for (const [cardId, entry] of Object.entries(body.progress)) {
      if (cardId.startsWith("card:") && isProgressEntry(entry)) progress[cardId] = entry;
    }
  }

  const imported = await importGuestData(requireDb(platform), user.id, { entries, lists, progress });
  return json(imported);
};

/** Keeps the items that pass validation; one bad local item must not block the rest. */
function validItems<T extends StudyEntry | PracticeList>(value: unknown, parse: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    try {
      return [parse(item)];
    } catch (caught) {
      if (isHttpError(caught)) return [];
      throw caught;
    }
  });
}
