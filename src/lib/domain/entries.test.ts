import { describe, expect, it } from "vitest";
import { entriesFromDeck, referenceEntry, resolveEntryReferences } from "./entries";
import type { Deck } from "./types";

const deck: Deck = {
  verbs: [{ lemma: "essere", nl: "zijn" }],
  words: [
    { id: "entry-from-storage", it: "cosa", nl: "ding" },
    { it: "tempo", nl: "tijd" },
  ],
};

describe("study entries", () => {
  it("adapts static deck data while preserving provided IDs", () => {
    expect(entriesFromDeck(deck).map(({ id, type }) => ({ id, type }))).toEqual([
      { id: "verb:essere", type: "verb" },
      { id: "entry-from-storage", type: "word" },
      { id: "word:tempo", type: "word" },
    ]);
  });

  it("resolves ordered list references and ignores unavailable entries", () => {
    const entries = entriesFromDeck(deck);
    const references = [
      referenceEntry(entries[2]),
      { entryId: "deleted-entry" },
      referenceEntry(entries[0]),
    ];

    expect(resolveEntryReferences(entries, references).map((entry) => entry.id)).toEqual([
      "word:tempo",
      "verb:essere",
    ]);
  });

  it("rejects duplicate IDs before they can make references ambiguous", () => {
    expect(() =>
      entriesFromDeck({
        words: [
          { id: "same-id", it: "uno", nl: "een" },
          { id: "same-id", it: "due", nl: "twee" },
        ],
      }),
    ).toThrow("Dubbel entry-ID in dataset: same-id");
  });
});
