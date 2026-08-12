import {
  GENDER_NL,
  NUMBER_NL,
  PERSON_LABEL,
  PERSON_SHORT,
  PERSONS,
  TENSE_LABEL,
  TENSE_NL,
  TENSES,
  WORDTYPE_NL,
} from "./constants";
import type { Card, Deck, Hint, ResolvedDirection } from "./types";

export function buildAllCards(data: Deck): Card[] {
  const cards: Card[] = [];

  for (const verb of data.verbs ?? []) {
    for (const tense of TENSES) {
      const forms = verb.forms?.[tense];
      if (!forms) continue;

      for (const person of PERSONS) {
        const form = forms[person];
        if (!form) continue;

        cards.push({
          id: `verb:${verb.lemma}:${tense}:${person}`,
          type: "verb",
          lemma: verb.lemma,
          lemmaNl: verb.nl,
          regularity: verb.regularity,
          auxiliary: verb.auxiliary,
          note: verb.note,
          tense,
          person,
          it: form.it,
          nl: form.nl,
        });
      }
    }
  }

  for (const word of data.words ?? []) {
    cards.push({
      id: `word:${word.it}`,
      type: "word",
      it: word.it,
      nl: word.nl,
      wordType: word.wordType,
      gender: word.gender,
      number: word.number,
      article: word.article,
    });
  }

  return cards;
}

export function italianDisplay(card: Card): string {
  if (card.type === "word" && card.wordType === "noun" && card.article) {
    return card.article.endsWith("'") ? `${card.article}${card.it}` : `${card.article} ${card.it}`;
  }

  return card.it;
}

export function composeHint(card: Card, dir: ResolvedDirection): Hint {
  const rows: Array<[string, string]> = [];

  if (card.type === "verb") {
    rows.push(["soort", WORDTYPE_NL.verb]);
    rows.push(["infinitief", dir === "nl_it" ? `${card.lemma} - ${card.lemmaNl}` : card.lemma]);
    if (card.regularity) rows.push(["regelmaat", card.regularity]);
    rows.push(["tijd", `${TENSE_LABEL[card.tense]} · ${TENSE_NL[card.tense]}`]);
    rows.push(["persoon", PERSON_LABEL[card.person]]);
    if (card.auxiliary) rows.push(["hulpwerkwoord", card.auxiliary]);
  } else {
    rows.push(["soort", WORDTYPE_NL[card.wordType ?? ""] ?? card.wordType ?? "woord"]);

    if (card.wordType === "noun") {
      if (card.gender) rows.push(["geslacht", GENDER_NL[card.gender] ?? card.gender]);
      if (card.number) rows.push(["getal", NUMBER_NL[card.number] ?? card.number]);
    }
  }

  return { rows, note: card.type === "verb" ? (card.note ?? null) : null };
}

export function cardLabel(card: Card): string {
  if (card.type === "verb") {
    return `${TENSE_LABEL[card.tense]} · ${PERSON_SHORT[card.person]}`;
  }

  return WORDTYPE_NL[card.wordType ?? ""] ?? card.wordType ?? "woord";
}

export function cardCounts(cards: Card[]) {
  const verbCards = cards.filter((card) => card.type === "verb");

  return {
    verbCards: verbCards.length,
    wordCards: cards.length - verbCards.length,
    verbCount: new Set(verbCards.map((card) => card.lemma)).size,
  };
}
