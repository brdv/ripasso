import { describe, expect, it, vi } from "vitest";
import { ENTRIES_KEY } from "./local-entries";
import { LISTS_KEY } from "./local-lists";
import { hasImported, importGuestDataOnce, SYNC_KEY } from "./guest-import";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };
}

const word = { id: "word:g", type: "word", it: "gatto", nl: "kat" };

describe("importGuestDataOnce", () => {
  it("sends local data once per user and records it", async () => {
    const storage = memoryStorage({
      [ENTRIES_KEY]: JSON.stringify({ version: 1, entries: [{ ...word, origin: "custom" }] }),
      [LISTS_KEY]: JSON.stringify({ version: 1, lists: [{ id: "l", name: "L", entryRefs: [] }] }),
      ripasso_progress_v2: JSON.stringify({ "card:word:g": { box: 2, seen: 1, correct: 1, wrong: 0, last: 5 } }),
    });
    const fetcher = vi.fn(async () => new Response("{}", { status: 200 }));

    expect(await importGuestDataOnce(storage, "u1", fetcher as unknown as typeof fetch, 42)).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetcher.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body).toEqual({
      entries: [word],
      lists: [{ id: "l", name: "L", entryRefs: [] }],
      progress: { "card:word:g": { box: 2, seen: 1, correct: 1, wrong: 0, last: 5 } },
    });
    expect(JSON.parse(storage.values.get(SYNC_KEY)!)).toEqual({ version: 1, imported: { u1: 42 } });

    expect(await importGuestDataOnce(storage, "u1", fetcher as unknown as typeof fetch)).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(hasImported(storage, "u2")).toBe(false);
    // Guest data stays in place.
    expect(storage.values.has(LISTS_KEY)).toBe(true);
  });

  it("skips the request when there is nothing to import, and does not record failures", async () => {
    const empty = memoryStorage();
    const fetcher = vi.fn(async () => new Response("{}", { status: 500 }));
    expect(await importGuestDataOnce(empty, "u1", fetcher as unknown as typeof fetch)).toBe(true);
    expect(fetcher).not.toHaveBeenCalled();

    const withList = memoryStorage({
      [LISTS_KEY]: JSON.stringify({ version: 1, lists: [{ id: "l", name: "L", entryRefs: [] }] }),
    });
    await expect(importGuestDataOnce(withList, "u1", fetcher as unknown as typeof fetch)).rejects.toThrow();
    expect(hasImported(withList, "u1")).toBe(false);
  });
});
