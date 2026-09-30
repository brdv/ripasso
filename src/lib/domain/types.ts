export type Direction = "nl_it" | "it_nl" | "mix";
export type ResolvedDirection = Exclude<Direction, "mix">;
export type SessionType = "smart" | "free";
export type ReviewFlow = "direct" | "paper";
export type Tense =
  | "presente"
  | "passato_prossimo"
  | "imperfetto"
  | "futuro_semplice"
  | "condizionale_presente";
export type Person = "io" | "tu" | "lui_lei" | "noi" | "voi" | "loro";

export interface VerbForm {
  it: string;
  nl: string;
}

export interface VerbSource {
  id?: string;
  lemma: string;
  nl: string;
  regularity?: string | null;
  conjugationClass?: string | null;
  auxiliary?: string | null;
  note?: string | null;
  forms?: Partial<Record<Tense, Partial<Record<Person, VerbForm>>>>;
}

export interface WordSource {
  id?: string;
  it: string;
  nl: string;
  wordType?: string | null;
  gender?: string | null;
  number?: string | null;
  article?: string | null;
}

export interface Deck {
  _meta?: Record<string, unknown>;
  verbs?: VerbSource[];
  words?: WordSource[];
}

export type EntryId = string;

export interface VerbEntry extends Omit<VerbSource, "id"> {
  id: EntryId;
  type: "verb";
}

export interface WordEntry extends Omit<WordSource, "id"> {
  id: EntryId;
  type: "word";
}

export type StudyEntry = VerbEntry | WordEntry;

export interface EntryReference {
  entryId: EntryId;
}

export interface PracticeList {
  id: string;
  name: string;
  entryRefs: EntryReference[];
  /** Set on lists the current user can practise but not change, such as the base list. */
  readOnly?: boolean;
}

export interface VerbCard {
  id: string;
  entryId: EntryId;
  type: "verb";
  lemma: string;
  lemmaNl: string;
  regularity?: string | null;
  auxiliary?: string | null;
  note?: string | null;
  tense: Tense;
  person: Person;
  it: string;
  nl: string;
}

export interface WordCard {
  id: string;
  entryId: EntryId;
  type: "word";
  it: string;
  nl: string;
  wordType?: string | null;
  gender?: string | null;
  number?: string | null;
  article?: string | null;
}

export type Card = VerbCard | WordCard;

export interface MenuState {
  dir: Direction;
  sessionType: SessionType;
  flow: ReviewFlow;
  includeVerbs: boolean;
  includeWords: boolean;
  tenses: Record<Tense, boolean>;
  count: number;
}

export interface ProgressEntry {
  box: number;
  seen: number;
  correct: number;
  wrong: number;
  last: number;
}

export type Progress = Record<string, ProgressEntry>;

export interface SessionItem {
  card: Card;
  dir: ResolvedDirection;
}

export type SessionPhase = "prompt" | "revealed" | "grading" | "paper-prompt";

export interface StudySession {
  state: MenuState;
  items: SessionItem[];
  idx: number;
  correct: number;
  phase: SessionPhase;
}

export interface Hint {
  rows: Array<[string, string]>;
  note: string | null;
}
