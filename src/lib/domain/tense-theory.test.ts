import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { formText } from "./conjugation";
import { TENSES } from "./constants";
import { parseRich, type RichNode } from "./rich-text";
import { irregularRows, modelLabel, TENSE_THEORY } from "./tense-theory";

const wiktionary = JSON.parse(readFileSync("src/lib/domain/conjugation.fixtures.json", "utf8")) as Record<
  string,
  { auxiliary: string; isc: boolean }
>;

function plainTexts(nodes: RichNode[]): string[] {
  return nodes.flatMap((node) => (typeof node === "string" ? [node] : plainTexts(node.children)));
}

describe("tense theory", () => {
  it("only shows model verbs conjugated exactly as checked against Wiktionary", () => {
    for (const tense of TENSES) {
      for (const model of TENSE_THEORY[tense].regular.models) {
        expect(wiktionary[model.lemma]).toEqual({
          auxiliary: model.auxiliary ?? "avere",
          isc: model.isc ?? false,
          forms: expect.anything(),
        });
      }
    }
  });

  it("writes every text with balanced markup", () => {
    for (const tense of TENSES) {
      const { intro, regular, irregular } = TENSE_THEORY[tense];
      const texts = [intro, regular.instruction, ...regular.legend, ...regular.notes, irregular.intro];
      if (irregular.shape === "grid") texts.push(...irregular.legend);
      for (const text of texts) {
        for (const plain of plainTexts(parseRich(text))) expect(plain, `${tense}: ${text}`).not.toMatch(/\*\*|[_[\]{}<>]/);
      }
    }
  });

  it("highlights a row exactly when a note refers to it", () => {
    for (const tense of TENSES) {
      const { highlight, notes } = TENSE_THEORY[tense].regular;
      expect(notes.some((note) => note.includes("gemarkeerde rij")), tense).toBe(highlight !== undefined);
    }
  });

  it("labels model verbs by group, or by auxiliary in the passato prossimo", () => {
    expect(modelLabel({ lemma: "finire", isc: true }, "presente")).toBe("-ire met -isc-");
    expect(modelLabel({ lemma: "arrivare", auxiliary: "essere" }, "passato_prossimo")).toBe("met essere");
  });

  it("generates the irregular sections from the conjugation rules", () => {
    const presente = irregularRows(TENSE_THEORY.presente.irregular, "presente");
    expect(presente.map(({ lemma, forms }) => [lemma, forms.map(formText).join(" ")])).toEqual([
      ["essere", "sono sei è siamo siete sono"],
      ["avere", "ho hai ha abbiamo avete hanno"],
    ]);
    // avete follows the rule, so nothing in it is marked irregular.
    expect(presente[1].forms[4].some((segment) => segment.kind === "irregular")).toBe(false);

    const participles = irregularRows(TENSE_THEORY.passato_prossimo.irregular, "passato_prossimo");
    expect(participles.map(({ lemma, piece }) => `${lemma} ${piece}`)).toEqual([
      "essere stato",
      "fare fatto",
      "dire detto",
      "venire venuto",
      "vedere visto",
    ]);

    const stems = irregularRows(TENSE_THEORY.condizionale_presente.irregular, "condizionale_presente");
    expect(stems[0]).toEqual({
      lemma: "essere",
      piece: "sar-",
      forms: [[{ text: "sar", kind: "irregular" }, { text: "ei", kind: "ending" }]],
    });
  });
});
