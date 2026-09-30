import { asc, eq, or, sql } from "drizzle-orm";
import type { StudyEntry } from "$lib/domain/types";
import type { Db } from "../db";
import { rowToEntry } from "../db/mapping";
import { entries } from "../db/schema";

export function createEntryStore(db: Db) {
  return {
    /** Public entries plus, when a user is given, that user's own entries. */
    async listVisible(userId?: string): Promise<StudyEntry[]> {
      const visible = userId
        ? or(eq(entries.visibility, "public"), eq(entries.ownerId, userId))
        : eq(entries.visibility, "public");
      const rows = await db
        .select({ id: entries.id, type: entries.type, data: entries.data })
        .from(entries)
        .where(visible)
        .orderBy(asc(entries.createdAt), asc(sql`rowid`));
      return rows.map(rowToEntry);
    },
  };
}
