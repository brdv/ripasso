import { resolveEntryReferences } from "./entries";
import type { EntryId, PracticeList, StudyEntry } from "./types";

export function normalizeListName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Een lijst heeft een naam nodig.");
  return trimmed;
}

export function createList(name: string, id: string = crypto.randomUUID()): PracticeList {
  return { id, name: normalizeListName(name), entryRefs: [] };
}

export function renameList(list: PracticeList, name: string): PracticeList {
  return { ...list, name: normalizeListName(name) };
}

export function hasEntry(list: PracticeList, entryId: EntryId): boolean {
  return list.entryRefs.some((ref) => ref.entryId === entryId);
}

export function addEntry(list: PracticeList, entryId: EntryId): PracticeList {
  if (hasEntry(list, entryId)) return list;
  return { ...list, entryRefs: [...list.entryRefs, { entryId }] };
}

export function removeEntry(list: PracticeList, entryId: EntryId): PracticeList {
  if (!hasEntry(list, entryId)) return list;
  return { ...list, entryRefs: list.entryRefs.filter((ref) => ref.entryId !== entryId) };
}

export function listEntries(list: PracticeList, entries: StudyEntry[]): StudyEntry[] {
  return resolveEntryReferences(entries, list.entryRefs);
}

export function listCounts(
  list: PracticeList,
  entries: StudyEntry[],
): { verbs: number; words: number } {
  const resolved = listEntries(list, entries);
  const verbs = resolved.filter((entry) => entry.type === "verb").length;
  return { verbs, words: resolved.length - verbs };
}

export function formatListCounts(counts: { verbs: number; words: number }): string {
  const verbs = `${counts.verbs} ${counts.verbs === 1 ? "werkwoord" : "werkwoorden"}`;
  const words = `${counts.words} ${counts.words === 1 ? "woord" : "woorden"}`;
  return `${verbs} · ${words}`;
}

export function isPracticeList(value: unknown): value is PracticeList {
  if (!value || typeof value !== "object") return false;
  const list = value as Record<string, unknown>;
  return (
    typeof list.id === "string" &&
    typeof list.name === "string" &&
    Array.isArray(list.entryRefs) &&
    list.entryRefs.every(
      (ref) =>
        Boolean(ref) &&
        typeof ref === "object" &&
        typeof (ref as Record<string, unknown>).entryId === "string",
    )
  );
}
