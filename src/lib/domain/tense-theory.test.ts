import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TENSES } from "./constants";
import { irregularExamples, TENSE_THEORY } from "./tense-theory";

const wiktionary = JSON.parse(readFileSync("src/lib/domain/conjugation.fixtures.json", "utf8")) as Record<
  string,
  { auxiliary: string; isc: boolean }
>;

describe("tense theory", () => {
  it("only shows model verbs conjugated exactly as checked against Wiktionary", () => {
    for (const tense of TENSES) {
      for (const model of TENSE_THEORY[tense].models) {
        expect(wiktionary[model.lemma]).toEqual({
          auxiliary: model.auxiliary ?? "avere",
          isc: model.isc ?? false,
          forms: expect.anything(),
        });
      }
    }
  });

  it("lists the irregular base verbs from the conjugation rules", () => {
    expect(irregularExamples("futureStem")).toContainEqual({ lemma: "essere", forms: [{ text: "sar-", irregular: true }] });
    expect(irregularExamples("participle").map(({ lemma }) => lemma)).toEqual(["essere", "fare", "dire", "venire", "vedere"]);
    expect(irregularExamples("presente").find(({ lemma }) => lemma === "andare")?.forms).toEqual([
      { text: "vado", irregular: true },
      { text: "vai", irregular: true },
      { text: "va", irregular: true },
      { text: "andiamo", irregular: false },
      { text: "andate", irregular: false },
      { text: "vanno", irregular: true },
    ]);
    expect(irregularExamples("imperfetto").map(({ lemma, forms }) => `${lemma}: ${forms[0].text}`)).toEqual([
      "essere: ero",
      "fare: facevo",
      "dire: dicevo",
    ]);
  });
});
