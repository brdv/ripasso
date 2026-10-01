import { describe, expect, it } from "vitest";
import { matchesSearch, normalizeSearch } from "./search";
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
