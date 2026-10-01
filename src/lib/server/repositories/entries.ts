import { and, asc, eq, or, sql } from "drizzle-orm";
import type { EntryId, StudyEntry } from "$lib/domain/types";
import type { Db } from "../db";
import { entryToRow, rowToEntry } from "../db/mapping";
import { entries } from "../db/schema";

export function createEntryStore(db: Db) {
  async function select(where: ReturnType<typeof eq> | undefined) {
    const rows = await db
      .select({ id: entries.id, type: entries.type, data: entries.data })
      .from(entries)
      .where(where)
      .orderBy(asc(entries.createdAt), asc(sql`rowid`));
    return rows.map(rowToEntry);
  }

  return {
    /** Public entries plus, when a user is given, that user's own entries. */
    async listVisible(userId?: string): Promise<StudyEntry[]> {
      return select(
        userId
          ? or(eq(entries.visibility, "public"), eq(entries.ownerId, userId))
          : eq(entries.visibility, "public"),
      );
    },

    async listOwn(userId: string): Promise<StudyEntry[]> {
      return select(eq(entries.ownerId, userId));
    },

    async exists(id: EntryId): Promise<boolean> {
      const rows = await db.select({ id: entries.id }).from(entries).where(eq(entries.id, id));
      return rows.length > 0;
    },

    /** Creates a private entry for the user. Returns false when the ID is already taken. */
    async create(userId: string, entry: StudyEntry, now = Date.now()): Promise<boolean> {
      const row = entryToRow(entry, { ownerId: userId, visibility: "private", createdAt: now, updatedAt: now });
      const result = await db.insert(entries).values(row).onConflictDoNothing().run();
      return result.meta.changes > 0;
    },

    /** Updates one of the user's own entries. Returns false when it is not theirs. */
    async update(userId: string, entry: StudyEntry, now = Date.now()): Promise<boolean> {
      const row = entryToRow(entry, { ownerId: userId, visibility: "private", createdAt: now, updatedAt: now });
      const result = await db
        .update(entries)
        .set({ data: row.data, searchText: row.searchText, updatedAt: now })
        .where(and(eq(entries.id, entry.id), eq(entries.ownerId, userId), eq(entries.type, entry.type)))
        .run();
      return result.meta.changes > 0;
    },

    /** Deletes one of the user's own entries. List references and progress are left in place. */
    async remove(userId: string, id: EntryId): Promise<boolean> {
      const result = await db
        .delete(entries)
        .where(and(eq(entries.id, id), eq(entries.ownerId, userId)))
        .run();
      return result.meta.changes > 0;
    },
  };
}
