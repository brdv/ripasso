import { WORDTYPE_NL } from "./constants";
import type { EntryId, StudyEntry, WordEntry } from "./types";

export const WORD_TYPES = Object.keys(WORDTYPE_NL).filter((type) => type !== "verb");
export const GENDERS = ["m", "f"] as const;
export const NUMBERS = ["singular", "plural"] as const;
export const ARTICLES = ["il", "lo", "la", "l'", "i", "gli", "le"] as const;

export interface WordDraft {
  it: string;
  nl: string;
  wordType: string;
  gender: string;
  number: string;
  article: string;
}

export type WordField = keyof WordDraft;

export interface ValidationResult<Field extends string, Value> {
  /** The cleaned value; only present when there are no errors. */
  value?: Value;
  errors: Partial<Record<Field, string>>;
  warnings: string[];
}

export function wordDraftFrom(entry?: WordEntry): WordDraft {
  return {
    it: entry?.it ?? "",
    nl: entry?.nl ?? "",
    wordType: entry?.wordType ?? "noun",
    gender: entry?.gender ?? "",
    number: entry?.number ?? "",
    article: entry?.article ?? "",
  };
}

/**
 * Validates a word form. `existing` is every entry the user can practise, used for the duplicate
 * warning; `id` is the entry being edited, which is excluded from that check.
 */
export function validateWord(
  draft: WordDraft,
  existing: StudyEntry[],
  id: EntryId,
): ValidationResult<WordField, WordEntry> {
  const errors: Partial<Record<WordField, string>> = {};
  const it = draft.it.trim();
  const nl = draft.nl.trim();
  const isNoun = draft.wordType === "noun";

  if (!it) errors.it = "Vul het Italiaanse woord in.";
  if (!nl) errors.nl = "Vul de Nederlandse vertaling in.";
  if (!WORD_TYPES.includes(draft.wordType)) errors.wordType = "Kies een woordsoort.";
  if (isNoun) {
    if (!isOneOf(draft.gender, GENDERS)) errors.gender = "Kies mannelijk, vrouwelijk of niets.";
    if (!isOneOf(draft.number, NUMBERS)) errors.number = "Kies enkelvoud, meervoud of niets.";
    if (!isOneOf(draft.article, ARTICLES)) errors.article = "Kies een geldig lidwoord of niets.";
  }

  const warnings: string[] = [];
  const duplicate = existing.some(
    (entry) =>
      entry.id !== id &&
      entry.type === "word" &&
      entry.it.trim().toLowerCase() === it.toLowerCase() &&
      (entry.wordType ?? "") === draft.wordType,
  );
  if (it && duplicate) warnings.push(`Er bestaat al een woord "${it}" van deze soort.`);

  if (Object.keys(errors).length > 0) return { errors, warnings };

  return {
    value: {
      id,
      type: "word",
      it,
      nl,
      wordType: draft.wordType,
      gender: isNoun ? draft.gender || null : null,
      number: isNoun ? draft.number || null : null,
      article: isNoun ? draft.article || null : null,
    },
    errors,
    warnings,
  };
}

function isOneOf(value: string, allowed: readonly string[]): boolean {
  return value === "" || allowed.includes(value);
}
