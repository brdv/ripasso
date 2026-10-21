import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { conjugate, formText, IRREGULAR_VERBS, shortAgreement, type Auxiliary } from "./conjugation";
import { PERSONS, TENSES } from "./constants";
import type { Deck, Person, Tense } from "./types";

interface Fixture {
  auxiliary: Auxiliary;
  isc: boolean;
  forms: Record<Tense, Record<Person, string>>;
}

const deck = JSON.parse(readFileSync("seed/data.json", "utf8")) as Deck;
const { _meta, ...wiktionary } = JSON.parse(readFileSync("src/lib/domain/conjugation.fixtures.json", "utf8")) as Record<
  string,
  Fixture
>;

describe("conjugation rules", () => {
  it("reproduces Wiktionary's forms of regular verbs, including spelling changes", () => {
    expect(_meta).toBeDefined();
    const mismatches: string[] = [];
    for (const [lemma, fixture] of Object.entries(wiktionary)) {
      for (const tense of TENSES) {
        for (const person of PERSONS) {
          const segments = conjugate(lemma, tense, person, { auxiliary: fixture.auxiliary, isc: fixture.isc });
          const actual = segments && formText(segments);
          if (actual !== fixture.forms[tense][person]) {
            mismatches.push(`${lemma} ${tense} ${person}: ${actual} ≠ ${fixture.forms[tense][person]}`);
          }
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  it("explains every base verb form by the rules or a named irregularity", () => {
    const unexplained: string[] = [];
    for (const verb of deck.verbs ?? []) {
      for (const tense of TENSES) {
        for (const person of PERSONS) {
          const expected = verb.forms?.[tense]?.[person]?.it;
          if (!expected) continue;
          const segments = conjugate(verb.lemma, tense, person, {
            auxiliary: (verb.auxiliary ?? "avere") as Auxiliary,
            irregular: IRREGULAR_VERBS[verb.lemma],
          });
          const actual = segments && formText(segments);
          if (actual !== expected) unexplained.push(`${verb.lemma} ${tense} ${person}: ${actual} ≠ ${expected}`);
        }
      }
    }
    expect(unexplained).toEqual([]);
  });

  it("lists no irregularity that the rules already produce", () => {
    const redundant: string[] = [];
    for (const [lemma, irregular] of Object.entries(IRREGULAR_VERBS)) {
      const regular = (tense: Tense, person: Person) => formText(conjugate(lemma, tense, person) ?? []);
      for (const [tense, forms] of Object.entries(irregular.forms ?? {}) as Array<[Tense, Partial<Record<Person, string>>]>) {
        for (const [person, form] of Object.entries(forms) as Array<[Person, string]>) {
          if (form === regular(tense, person)) redundant.push(`${lemma} ${tense} ${person}`);
        }
      }
      if (irregular.participle && `ho ${irregular.participle}` === regular("passato_prossimo", "io")) {
        redundant.push(`${lemma} participle`);
      }
      if (irregular.futureStem && `${irregular.futureStem}ò` === regular("futuro_semplice", "io")) {
        redundant.push(`${lemma} futureStem`);
      }
      if (irregular.imperfettoStem && `${irregular.imperfettoStem}vo` === regular("imperfetto", "io")) {
        redundant.push(`${lemma} imperfettoStem`);
      }
    }
    expect(redundant).toEqual([]);
  });

  it("marks the endings the rules add", () => {
    expect(conjugate("parlare", "presente", "noi")).toEqual([{ text: "parl" }, { text: "iamo", kind: "ending" }]);
    expect(conjugate("finire", "presente", "loro", { isc: true })).toEqual([
      { text: "fin" },
      { text: "isc", kind: "infix" },
      { text: "ono", kind: "ending" },
    ]);
    expect(conjugate("andare", "passato_prossimo", "noi", { auxiliary: "essere" })).toEqual([
      { text: "siamo ", kind: "auxiliary" },
      { text: "andat" },
      { text: "i", kind: "ending" },
      { text: "/" },
      { text: "andat" },
      { text: "e", kind: "ending" },
    ]);
    expect(conjugate("essere", "futuro_semplice", "io", { irregular: IRREGULAR_VERBS.essere })).toEqual([
      { text: "sar", kind: "irregular" },
      { text: "ò", kind: "ending" },
    ]);
  });

  it("shortens the agreement of essere forms for display", () => {
    const form = conjugate("arrivare", "passato_prossimo", "loro", { auxiliary: "essere" }) ?? [];
    expect(formText(shortAgreement(form))).toBe("sono arrivati/e");
    expect(formText(shortAgreement(conjugate("parlare", "passato_prossimo", "io") ?? []))).toBe("ho parlato");
  });

  it("does not conjugate infinitives outside the three groups", () => {
    expect(conjugate("tradurre", "presente", "io")).toBeNull();
  });
});
