import { describe, expect, it } from "vitest";
import { validateVerb, validateWord, verbDraftFrom, wordDraftFrom } from "./entry-validation";
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

describe("validateVerb", () => {
  const base = () => ({ ...verbDraftFrom(), lemma: "parlare", nl: "praten" });

  it("keeps only complete cells", () => {
    const draft = base();
    draft.forms.presente.io = { it: " parlo ", nl: "ik praat" };
    draft.auxiliary = "avere";
    draft.regularity = " regolare ";
    const result = validateVerb(draft, [], "verb:1");

    expect(result.errors).toEqual({});
    expect(result.value).toEqual({
      id: "verb:1",
      type: "verb",
      lemma: "parlare",
      nl: "praten",
      auxiliary: "avere",
      regularity: "regolare",
      conjugationClass: null,
      note: null,
      forms: { presente: { io: { it: "parlo", nl: "ik praat" } } },
    });
  });

  it("requires at least one complete cell", () => {
    const result = validateVerb(base(), [], "verb:1");
    expect(result.value).toBeUndefined();
    expect(result.errors.forms).toMatch(/minstens één vorm/);
  });

  it("blocks half-filled cells and names them", () => {
    const draft = base();
    draft.forms.presente.io = { it: "parlo", nl: "ik praat" };
    draft.forms.imperfetto.tu = { it: "parlavi", nl: "" };
    const result = validateVerb(draft, [], "verb:1");

    expect(result.value).toBeUndefined();
    expect(result.errors["forms.imperfetto.tu"]).toBe("Vul ook het Nederlands in.");
    expect(result.errors.forms).toMatch(/half ingevuld/);
  });

  it("checks required fields and allowed values, and warns about duplicates", () => {
    const draft = { ...base(), lemma: "", nl: " ", auxiliary: "stare", conjugationClass: "-urre" };
    draft.forms.presente.io = { it: "x", nl: "y" };
    const result = validateVerb(draft, [], "verb:1");
    expect(Object.keys(result.errors).sort()).toEqual(["auxiliary", "conjugationClass", "lemma", "nl"]);

    const duplicate = base();
    duplicate.lemma = "Essere";
    duplicate.forms.presente.io = { it: "sono", nl: "ik ben" };
    const existingVerb: StudyEntry = { id: "verb:essere", type: "verb", lemma: "essere", nl: "zijn" };
    expect(validateVerb(duplicate, [existingVerb], "verb:1").warnings).toHaveLength(1);
    expect(validateVerb(duplicate, [existingVerb], "verb:essere").warnings).toEqual([]);
  });

  it("round-trips an existing verb through the draft", () => {
    const entry = {
      id: "verb:2",
      type: "verb" as const,
      lemma: "andare",
      nl: "gaan",
      auxiliary: "essere",
      regularity: "irregolare",
      conjugationClass: "-are",
      note: "Let op",
      forms: { futuro_semplice: { noi: { it: "andremo", nl: "wij zullen gaan" } } },
    };
    expect(validateVerb(verbDraftFrom(entry), [], entry.id).value).toEqual(entry);
  });
});
