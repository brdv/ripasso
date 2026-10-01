import { describe, expect, it } from "vitest";
import type { StudyEntry } from "$lib/domain/types";
import { ENTRIES_KEY, LocalEntryRepository } from "./local-entries";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };
}

const shared: StudyEntry[] = [{ id: "word:casa", type: "word", it: "casa", nl: "huis" }];
const custom: StudyEntry = { id: "word:abc", type: "word", it: "gatto", nl: "kat", wordType: "noun" };

describe("LocalEntryRepository", () => {
  it("lists shared plus custom entries and keeps the origin marker in storage only", async () => {
    const storage = memoryStorage();
    const repository = new LocalEntryRepository(shared, storage);

    await repository.save(custom);
    await repository.save({ ...custom, nl: "de kat" });

    const stored = JSON.parse(storage.values.get(ENTRIES_KEY)!);
    expect(stored).toEqual({ version: 1, entries: [{ ...custom, nl: "de kat", origin: "custom" }] });

    const reloaded = new LocalEntryRepository(shared, storage);
    expect(await reloaded.list()).toEqual([...shared, { ...custom, nl: "de kat" }]);
    expect(await reloaded.listOwn()).toEqual([{ ...custom, nl: "de kat" }]);

    await reloaded.remove(custom.id);
    expect(await reloaded.list()).toEqual(shared);
  });

  it("refuses to change shared entries", async () => {
    const repository = new LocalEntryRepository(shared, memoryStorage());
    await expect(repository.save({ ...shared[0], nl: "x" })).rejects.toThrow();
    await expect(repository.remove("word:casa")).rejects.toThrow();
  });

  it("treats corrupt data as empty and reports it", async () => {
    for (const raw of ["{nope", '{"version":1,"entries":[{"id":1}]}', '{"version":9}']) {
      const repository = new LocalEntryRepository(shared, memoryStorage({ [ENTRIES_KEY]: raw }));
      expect(await repository.listOwn()).toEqual([]);
      expect(await repository.list()).toEqual(shared);
      expect(repository.ok).toBe(false);
    }
  });
});
