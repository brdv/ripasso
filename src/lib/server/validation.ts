import { error } from "@sveltejs/kit";
import { validateVerb, validateWord, verbDraftFrom, wordDraftFrom } from "$lib/domain/entry-validation";
import { isPracticeList, normalizeListName } from "$lib/domain/lists";
import type { PracticeList, StudyEntry, VerbEntry, WordEntry } from "$lib/domain/types";

/** Checks a posted entry with the same rules as the forms, and returns the cleaned entry. */
export function parseEntry(body: unknown): StudyEntry {
  if (!body || typeof body !== "object") error(400, "Ongeldige gegevens.");
  const input = body as Record<string, unknown>;
  const id = input.id;
  if (typeof id !== "string" || !/^(word|verb):[\w-]+$/.test(id) || !id.startsWith(`${input.type}:`)) {
    error(400, "Ongeldig ID.");
  }

  const result =
    input.type === "word"
      ? validateWord(wordDraftFrom(stringFields(input) as unknown as WordEntry), [], id)
      : input.type === "verb"
        ? validateVerb(verbDraftFrom(stringFields(input) as unknown as VerbEntry), [], id)
        : error(400, "Onbekend type.");

  if (!result.value) error(400, Object.values(result.errors)[0] ?? "Ongeldige gegevens.");
  return result.value;
}

export function parseList(body: unknown): PracticeList {
  if (!isPracticeList(body)) error(400, "Ongeldige lijst.");
  let name: string;
  try {
    name = normalizeListName(body.name);
  } catch (cause) {
    error(400, (cause as Error).message);
  }
  const entryIds = [...new Set(body.entryRefs.map((ref) => ref.entryId))];
  return { id: body.id, name, entryRefs: entryIds.map((entryId) => ({ entryId })) };
}

/** Keeps string fields and the verb form grid so drafts never see non-string values. */
function stringFields(input: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") clean[key] = value;
  }
  if (input.forms && typeof input.forms === "object") {
    const forms: Record<string, Record<string, { it: string; nl: string }>> = {};
    for (const [tense, persons] of Object.entries(input.forms as Record<string, unknown>)) {
      if (!persons || typeof persons !== "object") continue;
      for (const [person, form] of Object.entries(persons as Record<string, unknown>)) {
        const cell = form as Record<string, unknown> | null;
        if (cell && typeof cell.it === "string" && typeof cell.nl === "string") {
          forms[tense] = { ...forms[tense], [person]: { it: cell.it, nl: cell.nl } };
        }
      }
    }
    clean.forms = forms;
  }
  return clean;
}
