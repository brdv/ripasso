import { PERSONS } from "./constants";
import type { Person, Tense } from "./types";

export type ConjugationClass = "are" | "ere" | "ire";
export type Auxiliary = "avere" | "essere";

/** A piece of a conjugated form; `ending` marks the part the rule adds, for highlighting. */
export interface FormSegment {
  text: string;
  ending?: boolean;
}

/** Where a verb leaves the rules. Anything not listed here follows them. */
export interface Irregularities {
  /** Whole forms that follow no rule, only for the persons that differ. */
  forms?: Partial<Record<Tense, Partial<Record<Person, string>>>>;
  /** Stem the imperfetto endings attach to, instead of the infinitive without -re. */
  imperfettoStem?: string;
  participle?: string;
  /** Stem shared by the futuro and the condizionale. */
  futureStem?: string;
}

export interface ConjugateOptions {
  auxiliary?: Auxiliary;
  /** -ire verbs that insert -isc- in the presente (finire: finisco). */
  isc?: boolean;
  irregular?: Irregularities;
}

/** The irregularities of the base verbs. The seed test checks every base form against these and the rules. */
export const IRREGULAR_VERBS: Record<string, Irregularities> = {
  essere: {
    forms: {
      presente: { io: "sono", tu: "sei", lui_lei: "è", noi: "siamo", voi: "siete", loro: "sono" },
      imperfetto: { io: "ero", tu: "eri", lui_lei: "era", noi: "eravamo", voi: "eravate", loro: "erano" },
    },
    participle: "stato",
    futureStem: "sar",
  },
  avere: {
    forms: { presente: { io: "ho", tu: "hai", lui_lei: "ha", noi: "abbiamo", loro: "hanno" } },
    futureStem: "avr",
  },
  fare: {
    forms: { presente: { io: "faccio", tu: "fai", noi: "facciamo", loro: "fanno" } },
    imperfettoStem: "face",
    participle: "fatto",
    futureStem: "far",
  },
  dire: {
    forms: { presente: { io: "dico", tu: "dici", lui_lei: "dice", noi: "diciamo", loro: "dicono" } },
    imperfettoStem: "dice",
    participle: "detto",
  },
  potere: {
    forms: { presente: { io: "posso", tu: "puoi", lui_lei: "può", noi: "possiamo", loro: "possono" } },
    futureStem: "potr",
  },
  volere: {
    forms: { presente: { io: "voglio", tu: "vuoi", lui_lei: "vuole", noi: "vogliamo", loro: "vogliono" } },
    futureStem: "vorr",
  },
  dovere: {
    forms: { presente: { io: "devo", tu: "devi", lui_lei: "deve", noi: "dobbiamo", loro: "devono" } },
    futureStem: "dovr",
  },
  sapere: {
    forms: { presente: { io: "so", tu: "sai", lui_lei: "sa", noi: "sappiamo", loro: "sanno" } },
    futureStem: "sapr",
  },
  andare: {
    forms: { presente: { io: "vado", tu: "vai", lui_lei: "va", loro: "vanno" } },
    futureStem: "andr",
  },
  venire: {
    forms: { presente: { io: "vengo", tu: "vieni", lui_lei: "viene", loro: "vengono" } },
    participle: "venuto",
    futureStem: "verr",
  },
  stare: {
    forms: { presente: { tu: "stai", loro: "stanno" } },
    futureStem: "star",
  },
  vedere: {
    participle: "visto",
    futureStem: "vedr",
  },
};

const PRESENT_ENDINGS: Record<ConjugationClass | "isc", string[]> = {
  are: ["o", "i", "a", "iamo", "ate", "ano"],
  ere: ["o", "i", "e", "iamo", "ete", "ono"],
  ire: ["o", "i", "e", "iamo", "ite", "ono"],
  isc: ["isco", "isci", "isce", "iamo", "ite", "iscono"],
};
const IMPERFETTO_ENDINGS = ["vo", "vi", "va", "vamo", "vate", "vano"];
const FUTURO_ENDINGS = ["ò", "ai", "à", "emo", "ete", "anno"];
const CONDIZIONALE_ENDINGS = ["ei", "esti", "ebbe", "emmo", "este", "ebbero"];
const PARTICIPLE_ENDINGS: Record<ConjugationClass, string> = { are: "ato", ere: "uto", ire: "ito" };
/** The future stem adds this to the bare stem: parl- → parler-, cred- → creder-, dorm- → dormir-. */
const FUTURE_VOWEL: Record<ConjugationClass, string> = { are: "er", ere: "er", ire: "ir" };
const AUXILIARY_PRESENTE: Record<Auxiliary, string[]> = {
  avere: ["ho", "hai", "ha", "abbiamo", "avete", "hanno"],
  essere: ["sono", "sei", "è", "siamo", "siete", "sono"],
};

export function conjugationClass(lemma: string): ConjugationClass | null {
  const match = /(are|ere|ire)$/.exec(lemma.trim().toLowerCase());
  return match ? (match[1] as ConjugationClass) : null;
}

/** Applies Italian spelling to stem + ending: cerc + i → cerchi, mangi + erò → mangerò, studi + i → studi. */
function attach(stem: string, ending: string, cls: ConjugationClass): string {
  const front = /^[ei]/.test(ending);
  if (cls === "are" && front && /[cg]$/.test(stem)) return `${stem}h`;
  if (cls === "are" && front && /[cg]i$/.test(stem)) return stem.slice(0, -1);
  if (ending.startsWith("i") && stem.endsWith("i")) return stem.slice(0, -1);
  return stem;
}

function participleSegments(participle: string, auxiliary: Auxiliary, person: Person, regular: boolean): FormSegment[] {
  const stem = participle.slice(0, -1);
  if (auxiliary === "avere") {
    return regular ? [{ text: participle.slice(0, -3) }, { text: participle.slice(-3), ending: true }] : [{ text: participle }];
  }
  // With essere the participle agrees with the subject: andato/andata, andati/andate.
  const plural = PERSONS.indexOf(person) >= 3;
  const [masculine, feminine] = plural ? ["i", "e"] : ["o", "a"];
  return [{ text: stem }, { text: masculine, ending: true }, { text: `/${stem}` }, { text: feminine, ending: true }];
}

/**
 * Conjugates a verb by the rules, using `irregular` where the verb leaves them.
 * Returns null when the infinitive does not end in -are, -ere or -ire.
 */
export function conjugate(lemma: string, tense: Tense, person: Person, options: ConjugateOptions = {}): FormSegment[] | null {
  const infinitive = lemma.trim().toLowerCase();
  const cls = conjugationClass(infinitive);
  if (!cls) return null;
  const { irregular = {}, auxiliary = "avere", isc = false } = options;
  const override = irregular.forms?.[tense]?.[person];
  if (override) return [{ text: override }];

  const index = PERSONS.indexOf(person);
  const stem = infinitive.slice(0, -3);
  switch (tense) {
    case "presente": {
      const ending = PRESENT_ENDINGS[isc && cls === "ire" ? "isc" : cls][index];
      return [{ text: attach(stem, ending, cls) }, { text: ending, ending: true }];
    }
    case "imperfetto":
      return [{ text: irregular.imperfettoStem ?? infinitive.slice(0, -2) }, { text: IMPERFETTO_ENDINGS[index], ending: true }];
    case "futuro_semplice":
    case "condizionale_presente": {
      const futureStem = irregular.futureStem ?? attach(stem, FUTURE_VOWEL[cls], cls) + FUTURE_VOWEL[cls];
      const endings = tense === "futuro_semplice" ? FUTURO_ENDINGS : CONDIZIONALE_ENDINGS;
      return [{ text: futureStem }, { text: endings[index], ending: true }];
    }
    case "passato_prossimo": {
      const participle = irregular.participle ?? stem + PARTICIPLE_ENDINGS[cls];
      return [
        { text: `${AUXILIARY_PRESENTE[auxiliary][index]} ` },
        ...participleSegments(participle, auxiliary, person, !irregular.participle),
      ];
    }
  }
}

export function formText(segments: FormSegment[]): string {
  return segments.map((segment) => segment.text).join("");
}
