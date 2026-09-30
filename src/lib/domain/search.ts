import type { StudyEntry } from "./types";

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
