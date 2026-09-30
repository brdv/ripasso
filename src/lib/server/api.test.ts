import { isHttpError } from "@sveltejs/kit";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as entriesApi from "../../routes/api/entries/+server";
import * as entryApi from "../../routes/api/entries/[id]/+server";
import * as listsApi from "../../routes/api/lists/+server";
import * as listApi from "../../routes/api/lists/[id]/+server";
import { createTestDatabase } from "./testing/d1";

type Handler = (event: never) => Promise<Response> | Response;

const alice = { id: "user-alice", email: "alice@example.com" };
const bob = { id: "user-bob", email: "bob@example.com" };

const aliceWord = { id: "word:alice-1", type: "word", it: "gatto", nl: "kat", wordType: "noun" };
const aliceList = { id: "list-alice", name: "Van Alice", entryRefs: [{ entryId: aliceWord.id }] };

describe("authenticated API", () => {
  let database: Awaited<ReturnType<typeof createTestDatabase>>;

  /** Calls a route handler the way SvelteKit would, with `user` as the logged-in user. */
  async function call(
    handler: Handler,
    options: { user?: typeof alice | null; params?: Record<string, string>; body?: unknown; query?: string } = {},
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
    expect((await call(entriesApi.POST, { user: alice, body: aliceWord })).status).toBe(201);
    expect((await call(listsApi.POST, { user: alice, body: aliceList })).status).toBe(201);
  }, 60_000);

  afterAll(async () => {
    await database?.dispose();
  });

  it("requires a login for writes and for own-scoped reads", async () => {
    expect((await call(entriesApi.POST, { body: aliceWord })).status).toBe(401);
    expect((await call(entriesApi.GET, { query: "?scope=own" })).status).toBe(401);
    expect((await call(listsApi.GET)).status).toBe(401);
    expect((await call(listsApi.POST, { body: aliceList })).status).toBe(401);
    expect((await call(entryApi.PUT, { params: { id: aliceWord.id }, body: aliceWord })).status).toBe(401);
    expect((await call(entryApi.DELETE, { params: { id: aliceWord.id } })).status).toBe(401);
    expect((await call(listApi.PUT, { params: { id: aliceList.id }, body: aliceList })).status).toBe(401);
    expect((await call(listApi.DELETE, { params: { id: aliceList.id } })).status).toBe(401);
  });

  it("shows private entries and lists only to their owner", async () => {
    const guest = (await call(entriesApi.GET)).body as { id: string }[];
    const forBob = (await call(entriesApi.GET, { user: bob })).body as { id: string }[];
    const forAlice = (await call(entriesApi.GET, { user: alice })).body as { id: string }[];
    expect(guest.some((entry) => entry.id === aliceWord.id)).toBe(false);
    expect(forBob.some((entry) => entry.id === aliceWord.id)).toBe(false);
    expect(forAlice.some((entry) => entry.id === aliceWord.id)).toBe(true);
    expect((await call(entriesApi.GET, { user: bob, query: "?scope=own" })).body).toEqual([]);
    expect((await call(entriesApi.GET, { user: alice, query: "?scope=own" })).body).toEqual([
      { ...aliceWord, gender: null, number: null, article: null },
    ]);

    const bobLists = (await call(listsApi.GET, { user: bob })).body as { id: string; readOnly?: boolean }[];
    expect(bobLists).toEqual([expect.objectContaining({ id: "basis", name: "Basis", readOnly: true })]);
    const aliceLists = (await call(listsApi.GET, { user: alice })).body as { id: string }[];
    expect(aliceLists.map((list) => list.id)).toEqual(["basis", aliceList.id]);
    expect(aliceLists[1]).toEqual(aliceList);
  });

  it("returns 404 when changing or deleting someone else's entry", async () => {
    const edited = { ...aliceWord, nl: "poes" };
    expect((await call(entryApi.PUT, { user: bob, params: { id: aliceWord.id }, body: edited })).status).toBe(404);
    expect((await call(entryApi.DELETE, { user: bob, params: { id: aliceWord.id } })).status).toBe(404);
    expect((await call(entryApi.PUT, { user: bob, params: { id: "verb:essere" }, body: { id: "verb:essere", type: "verb", lemma: "essere", nl: "x", forms: { presente: { io: { it: "a", nl: "b" } } } } })).status).toBe(404);
    expect((await call(entryApi.DELETE, { user: alice, params: { id: "verb:essere" } })).status).toBe(404);
    expect((await call(entriesApi.POST, { user: bob, body: aliceWord })).status).toBe(409);
  });

  it("returns 404 when changing or deleting someone else's list or the base list", async () => {
    const renamed = { ...aliceList, name: "Van Bob" };
    expect((await call(listApi.PUT, { user: bob, params: { id: aliceList.id }, body: renamed })).status).toBe(404);
    expect((await call(listApi.DELETE, { user: bob, params: { id: aliceList.id } })).status).toBe(404);
    const basis = { id: "basis", name: "Mijn basis", entryRefs: [] };
    expect((await call(listApi.PUT, { user: alice, params: { id: "basis" }, body: basis })).status).toBe(404);
    expect((await call(listApi.DELETE, { user: alice, params: { id: "basis" } })).status).toBe(404);
    expect((await call(listsApi.POST, { user: bob, body: aliceList })).status).toBe(409);

    const aliceLists = (await call(listsApi.GET, { user: alice })).body as { name: string }[];
    expect(aliceLists.map((list) => list.name)).toEqual(["Basis", "Van Alice"]);
  });

  it("validates input with the form rules", async () => {
    const bad = await call(entriesApi.POST, { user: alice, body: { ...aliceWord, id: "word:alice-2", it: " " } });
    expect(bad.status).toBe(400);
    expect(bad.body).toEqual({ message: "Vul het Italiaanse woord in." });
    expect((await call(entriesApi.POST, { user: alice, body: { ...aliceWord, id: "verb:x" } })).status).toBe(400);
    expect((await call(listsApi.POST, { user: alice, body: { id: "l2", name: "  ", entryRefs: [] } })).status).toBe(400);
    const halfVerb = { id: "verb:half", type: "verb", lemma: "a", nl: "b", forms: { presente: { io: { it: "x", nl: "" } } } };
    expect((await call(entriesApi.POST, { user: alice, body: halfVerb })).status).toBe(400);
  });

  it("lets owners update and delete their own entries and lists", async () => {
    const word = { id: "word:alice-3", type: "word", it: "cane", nl: "hond", wordType: "noun" };
    expect((await call(entriesApi.POST, { user: alice, body: word })).status).toBe(201);
    const updated = await call(entryApi.PUT, { user: alice, params: { id: word.id }, body: { ...word, nl: "de hond" } });
    expect(updated).toMatchObject({ status: 200, body: { nl: "de hond" } });
    expect((await call(entryApi.PUT, { user: alice, params: { id: "word:other" }, body: word })).status).toBe(400);

    const list = { id: "list-alice-2", name: "Twee", entryRefs: [{ entryId: word.id }, { entryId: "verb:essere" }] };
    expect((await call(listsApi.POST, { user: alice, body: list })).status).toBe(201);
    const reordered = { ...list, name: "Twee!", entryRefs: [{ entryId: "verb:essere" }] };
    expect((await call(listApi.PUT, { user: alice, params: { id: list.id }, body: reordered })).status).toBe(200);
    const lists = (await call(listsApi.GET, { user: alice })).body as { id: string }[];
    expect(lists.find((l) => l.id === list.id)).toEqual(reordered);

    const big = { id: "list-alice-big", name: "Groot", entryRefs: Array.from({ length: 60 }, (_, i) => ({ entryId: `word:n${i}` })) };
    expect((await call(listsApi.POST, { user: alice, body: big })).status).toBe(201);
    expect((await call(listApi.PUT, { user: alice, params: { id: big.id }, body: big })).status).toBe(200);
    const withBig = (await call(listsApi.GET, { user: alice })).body as { id: string }[];
    expect(withBig.find((l) => l.id === big.id)).toEqual(big);

    expect((await call(entryApi.DELETE, { user: alice, params: { id: word.id } })).status).toBe(204);
    expect((await call(listApi.DELETE, { user: alice, params: { id: list.id } })).status).toBe(204);
    expect((await call(listApi.DELETE, { user: alice, params: { id: list.id } })).status).toBe(404);
  });
});
