import { isHttpError } from "@sveltejs/kit";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as importApi from "../../routes/api/import/+server";
import * as listsApi from "../../routes/api/lists/+server";
import * as entriesApi from "../../routes/api/entries/+server";
import * as progressApi from "../../routes/api/progress/+server";
import * as progressCardApi from "../../routes/api/progress/[cardId]/+server";
import { createTestDatabase } from "./testing/d1";

type Handler = (event: never) => Promise<Response> | Response;

const carol = { id: "user-carol", email: "carol@example.com" };
const dave = { id: "user-dave", email: "dave@example.com" };
const row = (last: number, box = 1) => ({ box, seen: 1, correct: box > 1 ? 1 : 0, wrong: 0, last });

describe("progress and guest import", () => {
  let database: Awaited<ReturnType<typeof createTestDatabase>>;

  async function call(
    handler: Handler,
    options: { user?: typeof carol | null; params?: Record<string, string>; body?: unknown; query?: string } = {},
  ): Promise<{ status: number; body: unknown }> {
    const url = new URL(`http://localhost/api${options.query ?? ""}`);
    const event = {
      platform: { env: { DB: database.d1 } },
      locals: { user: options.user ?? null },
      params: options.params ?? {},
      url,
      request: new Request(url, {
        method: options.body === undefined ? "GET" : "POST",
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      }),
    };
    try {
      // The handlers only read the fields above; the cast stands in for a full RequestEvent.
      const response = await handler(event as never);
      return { status: response.status, body: response.status === 204 ? null : await response.json() };
    } catch (caught) {
      if (isHttpError(caught)) return { status: caught.status, body: caught.body };
      throw caught;
    }
  }

  beforeAll(async () => {
    database = await createTestDatabase();
  }, 60_000);

  afterAll(async () => {
    await database?.dispose();
  });

  it("stores, reads, and clears progress per user", async () => {
    expect((await call(progressApi.GET)).status).toBe(401);
    const put = await call(progressCardApi.PUT, { user: dave, params: { cardId: "card:word:x" }, body: row(5, 2) });
    expect(put.status).toBe(200);
    expect((await call(progressCardApi.PUT, { user: dave, params: { cardId: "bad" }, body: row(5) })).status).toBe(400);
    expect((await call(progressCardApi.PUT, { user: dave, params: { cardId: "card:y" }, body: { box: 1 } })).status).toBe(400);

    expect((await call(progressApi.GET, { user: dave })).body).toEqual({ "card:word:x": row(5, 2) });
    expect((await call(progressApi.GET, { user: carol })).body).toEqual({});
    expect((await call(progressApi.DELETE, { user: dave })).status).toBe(204);
    expect((await call(progressApi.GET, { user: dave })).body).toEqual({});
  });

  it("imports guest entries, lists, and progress once, keeping newer server progress", async () => {
    await call(progressCardApi.PUT, { user: carol, params: { cardId: "card:verb:essere:presente:io" }, body: row(100, 4) });

    const payload = {
      entries: [
        { id: "word:guest-1", type: "word", it: "gatto", nl: "kat", wordType: "noun" },
        { id: "word:broken", type: "word", it: "", nl: "" },
      ],
      lists: [{ id: "guest-list", name: "Gastlijst", entryRefs: [{ entryId: "word:guest-1" }, { entryId: "verb:essere" }] }],
      progress: {
        "card:verb:essere:presente:io": row(50, 1),
        "card:word:guest-1": row(60, 2),
        "not-a-card": row(1),
      },
    };
    const first = await call(importApi.POST, { user: carol, body: payload });
    expect(first).toEqual({ status: 200, body: { entries: 1, lists: 1, progress: 2 } });

    // Changes made after the import must survive a repeated import.
    const renamed = { id: "guest-list", name: "Hernoemd", entryRefs: [{ entryId: "verb:essere" }] };
    const { PUT } = await import("../../routes/api/lists/[id]/+server");
    await call(PUT, { user: carol, params: { id: "guest-list" }, body: renamed });
    const second = await call(importApi.POST, { user: carol, body: payload });
    expect(second.status).toBe(200);

    const lists = (await call(listsApi.GET, { user: carol })).body as { id: string }[];
    expect(lists.filter((list) => list.id === "guest-list")).toEqual([renamed]);
    const own = (await call(entriesApi.GET, { user: carol, query: "?scope=own" })).body as { id: string }[];
    expect(own.map((entry) => entry.id)).toEqual(["word:guest-1"]);
    expect((await call(progressApi.GET, { user: carol })).body).toEqual({
      "card:verb:essere:presente:io": row(100, 4),
      "card:word:guest-1": row(60, 2),
    });
  });

  it("does not take over another user's list or entry IDs", async () => {
    const payload = {
      entries: [{ id: "word:guest-1", type: "word", it: "rubato", nl: "gestolen", wordType: "noun" }],
      lists: [{ id: "guest-list", name: "Overgenomen", entryRefs: [] }],
      progress: {},
    };
    expect((await call(importApi.POST, { user: dave, body: payload })).body).toMatchObject({ lists: 0 });
    expect((await call(listsApi.GET, { user: dave })).body).toEqual([expect.objectContaining({ id: "basis" })]);
    expect((await call(entriesApi.GET, { user: dave, query: "?scope=own" })).body).toEqual([]);
    const carolOwn = (await call(entriesApi.GET, { user: carol, query: "?scope=own" })).body as { it: string }[];
    expect(carolOwn[0].it).toBe("gatto");
  });

  it("merges large progress imports within D1's limits", async () => {
    const progress = Object.fromEntries(Array.from({ length: 150 }, (_, i) => [`card:word:n${i}`, row(i + 1)]));
    const result = await call(importApi.POST, { user: dave, body: { entries: [], lists: [], progress } });
    expect(result.body).toMatchObject({ progress: 150 });
    expect(Object.keys((await call(progressApi.GET, { user: dave })).body as object)).toHaveLength(150);
  });
});
