import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { entriesFromDeck } from "$lib/domain/entries";
import type { Deck, StudyEntry } from "$lib/domain/types";
import { getDb } from "../db";
import { entryToRow } from "../db/mapping";
import { entries } from "../db/schema";
import { createTestDatabase } from "../testing/d1";
import { createEntryStore } from "./entries";

const baseEntries = entriesFromDeck(JSON.parse(readFileSync("seed/data.json", "utf8")) as Deck);

describe("entry store", () => {
  let database: Awaited<ReturnType<typeof createTestDatabase>>;

  beforeAll(async () => {
    database = await createTestDatabase();
    const own: StudyEntry = { id: "word:mine", type: "word", it: "mio", nl: "van mij" };
    const other: StudyEntry = { id: "word:theirs", type: "word", it: "suo", nl: "van hem" };
    const meta = { visibility: "private" as const, createdAt: Date.now(), updatedAt: Date.now() };
    await getDb(database.d1)
      .insert(entries)
      .values([entryToRow(own, { ...meta, ownerId: "user-1" }), entryToRow(other, { ...meta, ownerId: "user-2" })]);
  }, 60_000);

  afterAll(async () => {
    await database?.dispose();
  });

  it("lists the seeded base entries in seed order for guests", async () => {
    const visible = await createEntryStore(getDb(database.d1)).listVisible();
    expect(visible).toEqual(baseEntries);
  });

  it("adds only the user's own private entries", async () => {
    const visible = await createEntryStore(getDb(database.d1)).listVisible("user-1");
    expect(visible).toHaveLength(baseEntries.length + 1);
    expect(visible.at(-1)).toMatchObject({ id: "word:mine" });
    expect(visible.some((entry) => entry.id === "word:theirs")).toBe(false);
  });
});
