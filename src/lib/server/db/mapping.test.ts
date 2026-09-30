import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { entriesFromDeck } from "$lib/domain/entries";
import type { Deck, StudyEntry } from "$lib/domain/types";
import { entryToRow, rowToEntry } from "./mapping";

const deck = JSON.parse(readFileSync("seed/data.json", "utf8")) as Deck;
const baseEntries = entriesFromDeck(deck);
const meta = { ownerId: "system", visibility: "public" as const, createdAt: 1, updatedAt: 2 };

describe("entry row mapping", () => {
  it("round-trips every base entry unchanged", () => {
    expect(baseEntries.length).toBeGreaterThan(0);
    for (const entry of baseEntries) {
      expect(rowToEntry(entryToRow(entry, meta))).toEqual(entry);
    }
  });

  it("keeps id and type in columns and builds accent-free search text", () => {
    const entry: StudyEntry = { id: "word:città", type: "word", it: "Città", nl: "de stad" };
    const row = entryToRow(entry, meta);

    expect(row).toMatchObject({ id: "word:città", type: "word", ownerId: "system", visibility: "public" });
    expect(JSON.parse(row.data)).toEqual({ it: "Città", nl: "de stad" });
    expect(row.searchText).toBe("citta de stad");
  });
});
