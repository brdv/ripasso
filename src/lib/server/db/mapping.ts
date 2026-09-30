import { entrySearchText } from "$lib/domain/search";
import type { StudyEntry } from "$lib/domain/types";
import type { EntryRow } from "./schema";

export type EntryVisibility = EntryRow["visibility"];

export interface EntryRowMeta {
  ownerId: string;
  visibility: EntryVisibility;
  createdAt: number;
  updatedAt: number;
}

export function entryToRow(entry: StudyEntry, meta: EntryRowMeta): EntryRow {
  const { id, type, ...data } = entry;
  return {
    id,
    type,
    ownerId: meta.ownerId,
    visibility: meta.visibility,
    data: JSON.stringify(data),
    searchText: entrySearchText(entry),
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
  };
}

export function rowToEntry(row: Pick<EntryRow, "id" | "type" | "data">): StudyEntry {
  const data = JSON.parse(row.data) as Omit<StudyEntry, "id" | "type">;
  return { ...data, id: row.id, type: row.type } as StudyEntry;
}
