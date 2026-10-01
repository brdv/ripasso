import { describe, expect, it } from "vitest";
import { validateWord, wordDraftFrom } from "./entry-validation";
import type { StudyEntry } from "./types";

const existing: StudyEntry[] = [
  { id: "word:casa", type: "word", it: "casa", nl: "huis", wordType: "noun" },
];

describe("validateWord", () => {
  it("returns a cleaned word entry", () => {
    const result = validateWord(
      { it: " gatto ", nl: " kat ", wordType: "noun", gender: "m", number: "singular", article: "il" },
      existing,
      "word:1",
    );
    expect(result.errors).toEqual({});
    expect(result.value).toEqual({
      id: "word:1",
      type: "word",
      it: "gatto",
      nl: "kat",
      wordType: "noun",
      gender: "m",
      number: "singular",
      article: "il",
    });
  });

  it("requires Italian and Dutch text and a valid word type", () => {
    const result = validateWord(
      { ...wordDraftFrom(), it: "  ", nl: "", wordType: "verb" },
      existing,
      "word:1",
    );
    expect(result.value).toBeUndefined();
    expect(Object.keys(result.errors).sort()).toEqual(["it", "nl", "wordType"]);
    expect(result.errors.it).toMatch(/Italiaanse/);
  });

  it("checks noun details and drops them for other word types", () => {
    const noun = validateWord(
      { it: "x", nl: "y", wordType: "noun", gender: "n", number: "dual", article: "un" },
      [],
      "word:1",
    );
    expect(Object.keys(noun.errors).sort()).toEqual(["article", "gender", "number"]);

    const adverb = validateWord(
      { it: "bene", nl: "goed", wordType: "adverb", gender: "m", number: "", article: "il" },
      [],
      "word:1",
    );
    expect(adverb.value).toMatchObject({ gender: null, number: null, article: null });
  });

  it("warns about duplicates without blocking", () => {
    const draft = { ...wordDraftFrom(), it: "Casa", nl: "woning" };
    const result = validateWord(draft, existing, "word:1");
    expect(result.value).toBeDefined();
    expect(result.warnings).toHaveLength(1);
    expect(validateWord(draft, existing, "word:casa").warnings).toEqual([]);
    expect(validateWord({ ...draft, wordType: "adjective" }, existing, "word:1").warnings).toEqual([]);
  });
});
