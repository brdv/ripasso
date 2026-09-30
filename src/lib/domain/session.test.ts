import { describe, expect, it } from "vitest";
import { buildSessionItems, defaultMenuState } from "./session";
import type { Progress, StudyEntry } from "./types";

const entries: StudyEntry[] = [
  {
    id: "verb:essere",
    type: "verb",
    lemma: "essere",
    nl: "zijn",
    forms: {
      presente: { io: { it: "sono", nl: "ik ben" } },
      futuro_semplice: { io: { it: "sarò", nl: "ik zal zijn" } },
    },
  },
  { id: "word:cosa", type: "word", it: "cosa", nl: "ding", wordType: "noun" },
];

describe("session selection", () => {
  it("expands selected verb entries across enabled tenses", () => {
    const menu = defaultMenuState();
    menu.includeWords = false;
    menu.tenses.passato_prossimo = false;
    menu.tenses.imperfetto = false;
    menu.tenses.futuro_semplice = true;

    expect(buildSessionItems(entries, menu, {}, () => 0.5).map((item) => item.card.id)).toEqual([
      "card:verb:essere:presente:io",
      "card:verb:essere:futuro_semplice:io",
    ]);
  });

  it("creates a session from only the entries supplied by a list", () => {
    const menu = defaultMenuState();
    const items = buildSessionItems([entries[0]], menu, {}, () => 0.5);

    expect(new Set(items.map((item) => item.card.entryId))).toEqual(new Set(["verb:essere"]));
  });

  it("returns no items when all content is disabled", () => {
    const menu = defaultMenuState();
    menu.includeWords = false;
    menu.includeVerbs = false;

    expect(buildSessionItems(entries, menu, {})).toEqual([]);
  });

  it("prioritises lower boxes and cards seen less recently", () => {
    const menu = defaultMenuState();
    menu.includeVerbs = false;
    const extraWord: StudyEntry = {
      id: "word:tempo",
      type: "word",
      it: "tempo",
      nl: "tijd",
    };
    const progress: Progress = {
      "card:word:cosa": { box: 3, seen: 2, correct: 2, wrong: 0, last: 100 },
      "card:word:tempo": { box: 1, seen: 1, correct: 0, wrong: 1, last: 200 },
    };

    const items = buildSessionItems([...entries, extraWord], menu, progress, () => 0.5);
    expect(items.map((item) => item.card.id)).toEqual(["card:word:tempo", "card:word:cosa"]);
  });
});
