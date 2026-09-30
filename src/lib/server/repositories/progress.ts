import { eq, sql } from "drizzle-orm";
import type { Progress, ProgressEntry } from "$lib/domain/types";
import type { Db } from "../db";
import { chunkRows } from "../db/chunk";
import { progress } from "../db/schema";

const PROGRESS_COLUMNS = 7;

export function createProgressStore(db: Db) {
  function rows(userId: string, entries: Progress) {
    return Object.entries(entries).map(([cardId, entry]) => ({ userId, cardId, ...pick(entry) }));
  }

  return {
    async load(userId: string): Promise<Progress> {
      const found = await db.select().from(progress).where(eq(progress.userId, userId));
      return Object.fromEntries(found.map((row) => [row.cardId, pick(row)]));
    },

    /** Stores the row as given; grading on the client already computed it. */
    async put(userId: string, cardId: string, entry: ProgressEntry): Promise<void> {
      const row = { userId, cardId, ...pick(entry) };
      await db
        .insert(progress)
        .values(row)
        .onConflictDoUpdate({ target: [progress.userId, progress.cardId], set: pick(entry) })
        .run();
    },

    async clear(userId: string): Promise<void> {
      await db.delete(progress).where(eq(progress.userId, userId)).run();
    },

    /** Statements merging `entries` into the user's progress: the row with the larger `last` wins. */
    mergeStatements(userId: string, entries: Progress) {
      return chunkRows(rows(userId, entries), PROGRESS_COLUMNS).map((chunk) =>
        db
          .insert(progress)
          .values(chunk)
          .onConflictDoUpdate({
            target: [progress.userId, progress.cardId],
            set: {
              box: sql`excluded.box`,
              seen: sql`excluded.seen`,
              correct: sql`excluded.correct`,
              wrong: sql`excluded.wrong`,
              last: sql`excluded.last`,
            },
            setWhere: sql`excluded.last > ${progress.last}`,
          }),
      );
    },
  };
}

function pick(entry: ProgressEntry): ProgressEntry {
  return { box: entry.box, seen: entry.seen, correct: entry.correct, wrong: entry.wrong, last: entry.last };
}
