import { describe, expect, it } from "vitest";
import { emptyFilter, filterEntries, matchesSearch, normalizeSearch, sortEntries } from "./search";
import type { StudyEntry } from "./types";

describe("entry search", () => {
  it("ignores case and accents", () => {
    expect(normalizeSearch("  Perché ")).toBe("perche");
    const word: StudyEntry = { id: "word:città", type: "word", it: "città", nl: "de stad" };
    expect(matchesSearch(word, "CITTA")).toBe(true);
    expect(matchesSearch(word, "stad")).toBe(true);
    expect(matchesSearch(word, "dorp")).toBe(false);
    expect(matchesSearch(word, "")).toBe(true);
  });

  it("matches verbs by lemma and translation", () => {
    const verb: StudyEntry = { id: "verb:essere", type: "verb", lemma: "essere", nl: "zijn" };
    expect(matchesSearch(verb, "ess")).toBe(true);
    expect(matchesSearch(verb, "zijn")).toBe(true);
  });
});

describe("filterEntries", () => {
  const entries: StudyEntry[] = [
    { id: "word:casa", type: "word", it: "casa", nl: "het huis" },
    { id: "verb:essere", type: "verb", lemma: "essere", nl: "zijn" },
    { id: "word:mine", type: "word", it: "àncora", nl: "het anker" },
  ];
  const ownIds = new Set(["word:mine"]);

  it("filters by kind, ownership, and search text together", () => {
    const ids = (filter: Partial<ReturnType<typeof emptyFilter>>) =>
      filterEntries(entries, { ...emptyFilter(), ...filter }, ownIds).map((entry) => entry.id);

    expect(ids({})).toEqual(["word:casa", "verb:essere", "word:mine"]);
    expect(ids({ kind: "verb" })).toEqual(["verb:essere"]);
    expect(ids({ kind: "word", ownOnly: true })).toEqual(["word:mine"]);
    expect(ids({ query: "huis" })).toEqual(["word:casa"]);
    expect(ids({ kind: "verb", query: "huis" })).toEqual([]);
  });

  it("sorts by Italian headword, ignoring accents", () => {
    expect(sortEntries(entries).map((entry) => entry.id)).toEqual(["word:mine", "word:casa", "verb:essere"]);
  });
});
