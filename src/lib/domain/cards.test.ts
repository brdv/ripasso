import { describe, expect, it } from "vitest";
import { composeHint, expandEntriesToCards, italianDisplay } from "./cards";
import { entriesFromDeck } from "./entries";
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
  const cards = expandEntriesToCards(entriesFromDeck(deck), ["presente"]);

  it("creates card IDs derived from their source entry", () => {
    expect(cards.map((card) => card.id)).toEqual([
      "card:verb:essere:presente:io",
      "card:word:ora",
    ]);
    expect(cards.map((card) => card.entryId)).toEqual(["verb:essere", "word:ora"]);
  });

  it("includes a noun's article in its Italian display value", () => {
    expect(italianDisplay(cards[1])).toBe("l'ora");
  });

  it("does not reveal the Dutch meaning in an Italian-to-Dutch verb hint", () => {
    const verb = cards[0];
    expect(composeHint(verb, "it_nl").rows).toContainEqual(["infinitief", "essere"]);
  });
});
