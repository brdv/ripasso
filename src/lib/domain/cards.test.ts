import { describe, expect, it } from "vitest";
import { buildAllCards, composeHint, italianDisplay } from "./cards";
import type { Deck } from "./types";

const deck: Deck = {
  verbs: [
    {
      lemma: "essere",
      nl: "zijn",
      regularity: "irregolare",
      auxiliary: "essere",
      note: "Veelgebruikte vorm.",
      forms: { presente: { io: { it: "sono", nl: "ik ben" } } },
    },
  ],
  words: [
    {
      it: "ora",
      nl: "uur",
      wordType: "noun",
      gender: "f",
      number: "singular",
      article: "l'",
    },
  ],
};

describe("card building", () => {
  it("creates stable IDs for verb forms and words", () => {
    expect(buildAllCards(deck).map((card) => card.id)).toEqual([
      "verb:essere:presente:io",
      "word:ora",
    ]);
  });

  it("includes a noun's article in its Italian display value", () => {
    expect(italianDisplay(buildAllCards(deck)[1])).toBe("l'ora");
  });

  it("does not reveal the Dutch meaning in an Italian-to-Dutch verb hint", () => {
    const verb = buildAllCards(deck)[0];
    expect(composeHint(verb, "it_nl").rows).toContainEqual(["infinitief", "essere"]);
  });
});
