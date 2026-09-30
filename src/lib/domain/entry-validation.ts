import { PERSONS, TENSES, WORDTYPE_NL } from "./constants";
import type { EntryId, Person, StudyEntry, Tense, VerbEntry, VerbForm, WordEntry } from "./types";

export const WORD_TYPES = Object.keys(WORDTYPE_NL).filter((type) => type !== "verb");
export const GENDERS = ["m", "f"] as const;
export const NUMBERS = ["singular", "plural"] as const;
export const ARTICLES = ["il", "lo", "la", "l'", "i", "gli", "le"] as const;
export const AUXILIARIES = ["avere", "essere"] as const;
export const CONJUGATION_CLASSES = ["-are", "-ere", "-ire"] as const;
export const REGULARITY_SUGGESTIONS = ["regolare", "irregolare"] as const;

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

export type VerbFormsDraft = Record<Tense, Record<Person, VerbForm>>;

export interface VerbDraft {
  lemma: string;
  nl: string;
  auxiliary: string;
  regularity: string;
  conjugationClass: string;
  note: string;
  forms: VerbFormsDraft;
}

/** Field keys are the draft's own keys, `forms` for the grid as a whole, or `forms.<tense>.<person>`. */
export type VerbField = Exclude<keyof VerbDraft, "forms"> | "forms" | `forms.${Tense}.${Person}`;

export function verbDraftFrom(entry?: VerbEntry): VerbDraft {
  const forms = Object.fromEntries(
    TENSES.map((tense) => [
      tense,
      Object.fromEntries(
        PERSONS.map((person) => {
          const form = entry?.forms?.[tense]?.[person];
          return [person, { it: form?.it ?? "", nl: form?.nl ?? "" }];
        }),
      ),
    ]),
  ) as VerbFormsDraft;

  return {
    lemma: entry?.lemma ?? "",
    nl: entry?.nl ?? "",
    auxiliary: entry?.auxiliary ?? "",
    regularity: entry?.regularity ?? "",
    conjugationClass: entry?.conjugationClass ?? "",
    note: entry?.note ?? "",
    forms,
  };
}

/**
 * Validates a verb form. Every grid cell is optional, but a cell needs both its Italian and
 * Dutch text or neither, and at least one complete cell is required.
 */
export function validateVerb(
  draft: VerbDraft,
  existing: StudyEntry[],
  id: EntryId,
): ValidationResult<VerbField, VerbEntry> {
  const errors: Partial<Record<VerbField, string>> = {};
  const lemma = draft.lemma.trim();
  const nl = draft.nl.trim();

  if (!lemma) errors.lemma = "Vul het Italiaanse werkwoord (infinitief) in.";
  if (!nl) errors.nl = "Vul de Nederlandse vertaling in.";
  if (!isOneOf(draft.auxiliary, AUXILIARIES)) errors.auxiliary = "Kies avere, essere of niets.";
  if (!isOneOf(draft.conjugationClass, CONJUGATION_CLASSES)) {
    errors.conjugationClass = "Kies -are, -ere, -ire of niets.";
  }

  const forms: NonNullable<VerbEntry["forms"]> = {};
  let incomplete = 0;
  for (const tense of TENSES) {
    for (const person of PERSONS) {
      const cell = draft.forms[tense]?.[person] ?? { it: "", nl: "" };
      const it = cell.it.trim();
      const cellNl = cell.nl.trim();
      if (it && cellNl) {
        forms[tense] = { ...forms[tense], [person]: { it, nl: cellNl } };
      } else if (it || cellNl) {
        incomplete += 1;
        errors[`forms.${tense}.${person}`] = it ? "Vul ook het Nederlands in." : "Vul ook het Italiaans in.";
      }
    }
  }
  if (incomplete > 0) {
    errors.forms =
      incomplete === 1
        ? "Eén vorm is maar half ingevuld: vul Italiaans en Nederlands allebei in, of laat beide leeg."
        : `${incomplete} vormen zijn maar half ingevuld: vul Italiaans en Nederlands allebei in, of laat beide leeg.`;
  } else if (Object.keys(forms).length === 0) {
    errors.forms = "Vul minstens één vorm in, met Italiaans en Nederlands.";
  }

  const warnings: string[] = [];
  const duplicate = existing.some(
    (entry) =>
      entry.id !== id && entry.type === "verb" && entry.lemma.trim().toLowerCase() === lemma.toLowerCase(),
  );
  if (lemma && duplicate) warnings.push(`Er bestaat al een werkwoord "${lemma}".`);

  if (Object.keys(errors).length > 0) return { errors, warnings };

  return {
    value: {
      id,
      type: "verb",
      lemma,
      nl,
      auxiliary: draft.auxiliary || null,
      regularity: draft.regularity.trim() || null,
      conjugationClass: draft.conjugationClass || null,
      note: draft.note.trim() || null,
      forms,
    },
    errors,
    warnings,
  };
}

function isOneOf(value: string, allowed: readonly string[]): boolean {
  return value === "" || allowed.includes(value);
}
