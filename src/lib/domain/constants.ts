import type { Person, Tense } from "./types";

export const PERSONS: Person[] = ["io", "tu", "lui_lei", "noi", "voi", "loro"];

export const TENSES: Tense[] = [
  "presente",
  "passato_prossimo",
  "imperfetto",
  "futuro_semplice",
  "condizionale_presente",
];

export const TENSE_LABEL: Record<Tense, string> = {
  presente: "presente",
  passato_prossimo: "passato prossimo",
  imperfetto: "imperfetto",
  futuro_semplice: "futuro semplice",
  condizionale_presente: "condizionale",
};

export const TENSE_NL: Record<Tense, string> = {
  presente: "tegenwoordige tijd",
  passato_prossimo:
    "voltooid tegenwoordige tijd - samengesteld: hulpwerkwoord + voltooid deelwoord",
  imperfetto: "onvoltooid verleden tijd - 'ik deed / was aan het...'",
  futuro_semplice: "toekomende tijd",
  condizionale_presente: "voorwaardelijke wijs - 'ik zou...'",
};

export const PERSON_LABEL: Record<Person, string> = {
  io: "io - 1e pers. enkelvoud",
  tu: "tu - 2e pers. enkelvoud",
  lui_lei: "lui/lei - 3e pers. enkelvoud",
  noi: "noi - 1e pers. meervoud",
  voi: "voi - 2e pers. meervoud",
  loro: "loro - 3e pers. meervoud",
};

export const PERSON_SHORT: Record<Person, string> = {
  io: "io",
  tu: "tu",
  lui_lei: "lui/lei",
  noi: "noi",
  voi: "voi",
  loro: "loro",
};

export const WORDTYPE_NL: Record<string, string> = {
  noun: "zelfstandig naamwoord",
  adverb: "bijwoord",
  interjection: "tussenwerpsel / uitdrukking",
  adjective: "bijvoeglijk naamwoord",
  verb: "werkwoord",
};

export const GENDER_NL: Record<string, string> = { m: "mannelijk", f: "vrouwelijk" };
export const NUMBER_NL: Record<string, string> = {
  singular: "enkelvoud",
  plural: "meervoud",
};
