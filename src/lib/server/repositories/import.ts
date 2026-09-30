import { inArray } from "drizzle-orm";
import type { PracticeList, Progress, StudyEntry } from "$lib/domain/types";
import type { Db } from "../db";
import { chunkRows } from "../db/chunk";
import { entryToRow } from "../db/mapping";
import { entries, listEntries, lists } from "../db/schema";
import { createProgressStore } from "./progress";

export interface GuestData {
  entries: StudyEntry[];
  lists: PracticeList[];
  progress: Progress;
}

/**
 * Imports a guest's local data into an account in one batch. Entries and lists keep their IDs and
 * are only created when the ID is free, so repeating an import changes nothing; progress merges
 * per card with the larger `last` winning.
 */
export async function importGuestData(db: Db, userId: string, data: GuestData, now = Date.now()) {
  const listIds = data.lists.map((list) => list.id);
  const taken = new Set<string>();
  for (const ids of chunkRows(listIds, 1)) {
    const found = await db.select({ id: lists.id }).from(lists).where(inArray(lists.id, ids));
    for (const { id } of found) taken.add(id);
  }
  const newLists = data.lists.filter((list) => !taken.has(list.id));

  const entryRows = data.entries.map((entry) =>
    entryToRow(entry, { ownerId: userId, visibility: "private", createdAt: now, updatedAt: now }),
  );
  const listRows = newLists.map((list) => ({
    id: list.id,
    ownerId: userId,
    name: list.name,
    visibility: "private" as const,
    createdAt: now,
    updatedAt: now,
  }));
  const refRows = newLists.flatMap((list) =>
    list.entryRefs.map((ref, position) => ({ listId: list.id, entryId: ref.entryId, position, addedAt: now })),
  );

  const statements = [
    ...chunkRows(entryRows, 8).map((rows) => db.insert(entries).values(rows).onConflictDoNothing()),
    ...chunkRows(listRows, 6).map((rows) => db.insert(lists).values(rows).onConflictDoNothing()),
    ...chunkRows(refRows, 4).map((rows) => db.insert(listEntries).values(rows).onConflictDoNothing()),
    ...createProgressStore(db).mergeStatements(userId, data.progress),
  ];
  if (statements.length > 0) {
    await db.batch(statements as [(typeof statements)[number], ...typeof statements]);
  }

  return { entries: entryRows.length, lists: newLists.length, progress: Object.keys(data.progress).length };
}
