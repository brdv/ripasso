import type { EntryId, StudyEntry } from "./types";

export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function entrySearchText(entry: StudyEntry): string {
  const parts = entry.type === "verb" ? [entry.lemma, entry.nl] : [entry.it, entry.nl];
  return normalizeSearch(parts.join(" "));
}

export function matchesSearch(entry: StudyEntry, query: string): boolean {
  const needle = normalizeSearch(query);
  return !needle || entrySearchText(entry).includes(needle);
}

export type EntryKind = "all" | "verb" | "word";

export interface EntryFilter {
  query: string;
  kind: EntryKind;
  /** Only the user's own entries. */
  ownOnly: boolean;
}

export function emptyFilter(): EntryFilter {
  return { query: "", kind: "all", ownOnly: false };
}

export function filterEntries(
  entries: StudyEntry[],
  filter: EntryFilter,
  ownIds: ReadonlySet<EntryId>,
): StudyEntry[] {
  return entries.filter(
    (entry) =>
      (filter.kind === "all" || entry.type === filter.kind) &&
      (!filter.ownOnly || ownIds.has(entry.id)) &&
      matchesSearch(entry, filter.query),
  );
}

/** The Italian headword: the infinitive of a verb, the word itself otherwise. */
export function entryName(entry: StudyEntry): string {
  return entry.type === "verb" ? entry.lemma : entry.it;
}

/** Alphabetical by Italian headword, ignoring case and accents. */
export function sortEntries(entries: StudyEntry[]): StudyEntry[] {
  return [...entries].sort((a, b) =>
    normalizeSearch(entryName(a)).localeCompare(normalizeSearch(entryName(b)), "it"),
  );
}
