import { describe, expect, it } from "vitest";
import { addEntry, createList } from "$lib/domain/lists";
import { LISTS_KEY, LocalListRepository } from "./local-lists";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };
}

describe("LocalListRepository", () => {
  it("saves, updates, and removes lists in a versioned key", async () => {
    const storage = memoryStorage();
    const repository = new LocalListRepository(storage);
    const list = createList("Week 1", "list-1");

    await repository.save(list);
    await repository.save(addEntry(list, "verb:essere"));
    await repository.save(createList("Week 2", "list-2"));

    expect(JSON.parse(storage.values.get(LISTS_KEY)!)).toMatchObject({ version: 1 });
    const reloaded = await new LocalListRepository(storage).list();
    expect(reloaded.map((l) => l.id)).toEqual(["list-1", "list-2"]);
    expect(reloaded[0].entryRefs).toEqual([{ entryId: "verb:essere" }]);

    await repository.remove("list-1");
    expect((await repository.list()).map((l) => l.id)).toEqual(["list-2"]);
    expect(repository.ok).toBe(true);
  });

  it("treats corrupt or unknown data as empty and reports it", async () => {
    for (const raw of ["{not json", '{"version":2,"lists":[]}', '"text"']) {
      const repository = new LocalListRepository(memoryStorage({ [LISTS_KEY]: raw }));
      expect(await repository.list()).toEqual([]);
      expect(repository.ok).toBe(false);
    }

    const partial = new LocalListRepository(
      memoryStorage({
        [LISTS_KEY]: JSON.stringify({
          version: 1,
          lists: [{ id: "a", name: "A", entryRefs: [] }, { id: 3 }],
        }),
      }),
    );
    expect((await partial.list()).map((l) => l.id)).toEqual(["a"]);
    expect(partial.ok).toBe(false);
  });

  it("rejects when storage cannot be written", async () => {
    const storage = memoryStorage();
    storage.setItem = () => {
      throw new Error("quota");
    };
    const repository = new LocalListRepository(storage);

    await expect(repository.save(createList("A", "a"))).rejects.toThrow();
    expect(repository.ok).toBe(false);
  });
});
