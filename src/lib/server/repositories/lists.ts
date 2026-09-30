import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import type { PracticeList } from "$lib/domain/types";
import type { Db } from "../db";
import { chunkRows } from "../db/chunk";
import { listEntries, lists } from "../db/schema";

export function createListStore(db: Db) {
  async function withEntries(rows: { id: string; name: string; ownerId: string }[], userId: string) {
    if (rows.length === 0) return [];
    const refs = await db
      .select({ listId: listEntries.listId, entryId: listEntries.entryId })
      .from(listEntries)
      .where(inArray(listEntries.listId, rows.map((row) => row.id)))
      .orderBy(asc(listEntries.position));

    return rows.map((row): PracticeList => {
      const list: PracticeList = {
        id: row.id,
        name: row.name,
        entryRefs: refs.filter((ref) => ref.listId === row.id).map(({ entryId }) => ({ entryId })),
      };
      if (row.ownerId !== userId) list.readOnly = true;
      return list;
    });
  }

  function entryRows(list: PracticeList, now: number) {
    return list.entryRefs.map((ref, position) => ({
      listId: list.id,
      entryId: ref.entryId,
      position,
      addedAt: now,
    }));
  }

  return {
    /** Public lists (read-only, such as "Basis") followed by the user's own lists. */
    async listVisible(userId: string): Promise<PracticeList[]> {
      const rows = await db
        .select({ id: lists.id, name: lists.name, ownerId: lists.ownerId })
        .from(lists)
        .where(or(eq(lists.visibility, "public"), eq(lists.ownerId, userId)))
        .orderBy(desc(eq(lists.visibility, "public")), asc(lists.createdAt));
      return withEntries(rows, userId);
    },

    async getOwn(userId: string, id: string): Promise<PracticeList | null> {
      const rows = await db
        .select({ id: lists.id, name: lists.name, ownerId: lists.ownerId })
        .from(lists)
        .where(and(eq(lists.id, id), eq(lists.ownerId, userId)));
      return (await withEntries(rows, userId))[0] ?? null;
    },

    /** Returns false when the ID is already taken. */
    async create(userId: string, list: PracticeList, now = Date.now()): Promise<boolean> {
      const result = await db
        .insert(lists)
        .values({ id: list.id, ownerId: userId, name: list.name, visibility: "private", createdAt: now, updatedAt: now })
        .onConflictDoNothing()
        .run();
      if (result.meta.changes === 0) return false;
      const inserts = chunkRows(entryRows(list, now), 4).map((rows) => db.insert(listEntries).values(rows));
      if (inserts.length > 0) await db.batch(inserts as [(typeof inserts)[number], ...typeof inserts]);
      return true;
    },

    /** Replaces name and entries of one of the user's own lists. Returns false when not theirs. */
    async update(userId: string, list: PracticeList, now = Date.now()): Promise<boolean> {
      if (!(await this.getOwn(userId, list.id))) return false;
      await db.batch([
        db.update(lists).set({ name: list.name, updatedAt: now }).where(eq(lists.id, list.id)),
        db.delete(listEntries).where(eq(listEntries.listId, list.id)),
        ...chunkRows(entryRows(list, now), 4).map((rows) => db.insert(listEntries).values(rows)),
      ]);
      return true;
    },

    async remove(userId: string, id: string): Promise<boolean> {
      if (!(await this.getOwn(userId, id))) return false;
      await db.batch([
        db.delete(listEntries).where(eq(listEntries.listId, id)),
        db.delete(lists).where(eq(lists.id, id)),
      ]);
      return true;
    },
  };
}
