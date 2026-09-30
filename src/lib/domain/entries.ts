import type {
  Deck,
  EntryReference,
  StudyEntry,
  VerbEntry,
  WordEntry,
} from "./types";

export function entriesFromDeck(deck: Deck): StudyEntry[] {
  const verbs: VerbEntry[] = (deck.verbs ?? []).map((verb) => ({
    ...verb,
    id: verb.id ?? `verb:${verb.lemma}`,
    type: "verb",
  }));

  const words: WordEntry[] = (deck.words ?? []).map((word) => ({
    ...word,
    id: word.id ?? `word:${word.it}`,
    type: "word",
  }));

  const entries = [...verbs, ...words];
  assertUniqueEntryIds(entries);
  return entries;
}

function assertUniqueEntryIds(entries: StudyEntry[]): void {
  const seen = new Set<string>();

  for (const entry of entries) {
    if (seen.has(entry.id)) {
      throw new Error(`Dubbel entry-ID in dataset: ${entry.id}`);
    }
    seen.add(entry.id);
  }
}

export function referenceEntry(entry: StudyEntry): EntryReference {
  return { entryId: entry.id };
}

export function resolveEntryReferences(
  entries: StudyEntry[],
  references: EntryReference[],
): StudyEntry[] {
  const entriesById = new Map(entries.map((entry) => [entry.id, entry]));

  return references.flatMap(({ entryId }) => {
    const entry = entriesById.get(entryId);
    return entry ? [entry] : [];
  });
}
