import type { EntryId, PracticeList, StudyEntry } from "$lib/domain/types";

export interface ListRepository {
  list(): Promise<PracticeList[]>;
  save(list: PracticeList): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface EntryRepository {
  /** Everything the current user may practise: shared entries plus their own. */
  list(): Promise<StudyEntry[]>;
  /** Only the current user's own, editable entries. */
  listOwn(): Promise<StudyEntry[]>;
  save(entry: StudyEntry): Promise<void>;
  remove(id: EntryId): Promise<void>;
}
