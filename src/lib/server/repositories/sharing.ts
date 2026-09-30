import { and, eq, inArray, or } from "drizzle-orm";
import type { EntryId, PracticeList, StudyEntry } from "$lib/domain/types";
import type { Db } from "../db";
import { chunkRows } from "../db/chunk";
import { rowToEntry } from "../db/mapping";
import { entries } from "../db/schema";
import { createEntryStore } from "./entries";
import { createListStore } from "./lists";

export interface SharedList {
  list: PracticeList;
  entries: StudyEntry[];
  ownerId: string;
}

/**
 * A shared list and the entries it references that are public or belong to the list's owner.
 * This is the only way the owner's private entries can be read by someone else.
 */
export async function getSharedList(db: Db, slug: string): Promise<SharedList | null> {
  const shared = await createListStore(db).getShared(slug);
  if (!shared) return null;

  const ids = shared.list.entryRefs.map((ref) => ref.entryId);
  const found = new Map<EntryId, StudyEntry>();
  for (const chunk of chunkRows(ids, 2)) {
    const rows = await db
      .select({ id: entries.id, type: entries.type, data: entries.data })
      .from(entries)
      .where(
        and(
          inArray(entries.id, chunk),
          or(eq(entries.visibility, "public"), eq(entries.ownerId, shared.ownerId)),
        ),
      );
    for (const row of rows) found.set(row.id, rowToEntry(row));
  }

  return {
    list: shared.list,
    entries: ids.flatMap((id) => (found.has(id) ? [found.get(id)!] : [])),
    ownerId: shared.ownerId,
  };
}

/**
 * Copies a shared list into the user's account. Public entries are referenced as they are; the
 * owner's other entries are cloned as the user's own entries with new IDs, so the copy keeps
 * working when the original is changed, unshared, or deleted.
 */
export async function copySharedList(db: Db, userId: string, shared: SharedList, now = Date.now()) {
  const publicIds = new Set<EntryId>();
  for (const chunk of chunkRows(shared.entries.map((entry) => entry.id), 2)) {
    const rows = await db
      .select({ id: entries.id })
      .from(entries)
      .where(and(inArray(entries.id, chunk), eq(entries.visibility, "public")));
    for (const row of rows) publicIds.add(row.id);
  }

  const entryStore = createEntryStore(db);
  const entryRefs: PracticeList["entryRefs"] = [];
  for (const entry of shared.entries) {
    if (publicIds.has(entry.id)) {
      entryRefs.push({ entryId: entry.id });
      continue;
    }
    const clone = { ...entry, id: `${entry.type}:${crypto.randomUUID()}` } as StudyEntry;
    await entryStore.create(userId, clone, now);
    entryRefs.push({ entryId: clone.id });
  }

  const copy: PracticeList = { id: crypto.randomUUID(), name: shared.list.name, entryRefs };
  await createListStore(db).create(userId, copy, now);
  return copy;
}
