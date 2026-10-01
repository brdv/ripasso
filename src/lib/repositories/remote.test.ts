import { describe, expect, it } from "vitest";
import { RemoteListRepository } from "./remote";

describe("RemoteListRepository", () => {
  it("sends writes in order, even when an earlier request is slow", async () => {
    const calls: { method: string; url: string; body: unknown }[] = [];
    let releaseFirst: () => void = () => {};
    const firstDone = new Promise<void>((resolve) => (releaseFirst = resolve));

    const fetcher = (async (url: string, init?: RequestInit) => {
      calls.push({ method: init?.method ?? "GET", url, body: init?.body ? JSON.parse(String(init.body)) : null });
      if (calls.length === 1) await firstDone;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    const repository = new RemoteListRepository(fetcher);
    const list = { id: "l1", name: "Lijst", entryRefs: [] };
    const created = repository.save(list);
    const updated = repository.save({ ...list, entryRefs: [{ entryId: "verb:essere" }] });

    // The update must not start while the create is still in flight.
    await Promise.resolve();
    expect(calls).toHaveLength(1);
    releaseFirst();
    await Promise.all([created, updated]);

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual(["POST /api/lists", "PUT /api/lists/l1"]);
    expect(calls[1].body).toEqual({ id: "l1", name: "Lijst", entryRefs: [{ entryId: "verb:essere" }] });
  });

  it("keeps going after a failed write", async () => {
    let call = 0;
    const fetcher = (async () => new Response("{}", { status: ++call === 1 ? 500 : 200 })) as unknown as typeof fetch;
    const repository = new RemoteListRepository(fetcher);

    await expect(repository.save({ id: "a", name: "A", entryRefs: [] })).rejects.toThrow();
    await expect(repository.save({ id: "b", name: "B", entryRefs: [] })).resolves.toBeUndefined();
  });
});
