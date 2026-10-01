import { isHttpError } from "@sveltejs/kit";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as entriesApi from "../../routes/api/entries/+server";
import * as listsApi from "../../routes/api/lists/+server";
import * as listApi from "../../routes/api/lists/[id]/+server";
import * as shareApi from "../../routes/api/lists/[id]/share/+server";
import * as sharedApi from "../../routes/api/shared/[slug]/+server";
import * as copyApi from "../../routes/api/shared/[slug]/copy/+server";
import { createTestDatabase } from "./testing/d1";

type Handler = (event: never) => Promise<Response> | Response;

const owner = { id: "user-owner", email: "owner@example.com" };
const friend = { id: "user-friend", email: "friend@example.com" };
const ownWord = { id: "word:owner-1", type: "word", it: "segreto", nl: "geheim", wordType: "noun" };
const otherWord = { id: "word:friend-1", type: "word", it: "altro", nl: "ander", wordType: "noun" };

describe("sharing lists", () => {
  let database: Awaited<ReturnType<typeof createTestDatabase>>;

  async function call(
    handler: Handler,
    options: { user?: typeof owner | null; params?: Record<string, string>; body?: unknown } = {},
  ): Promise<{ status: number; body: unknown }> {
    const url = new URL("http://localhost/api");
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
    await call(entriesApi.POST, { user: owner, body: ownWord });
    await call(entriesApi.POST, { user: friend, body: otherWord });
    const list = {
      id: "shared-list",
      name: "Te delen",
      entryRefs: [{ entryId: ownWord.id }, { entryId: "verb:essere" }, { entryId: otherWord.id }, { entryId: "word:gone" }],
    };
    await call(listsApi.POST, { user: owner, body: list });
  }, 60_000);

  afterAll(async () => {
    await database?.dispose();
  });

  it("shares by an unguessable slug readable by anyone, but only for the owner to set", async () => {
    expect((await call(shareApi.POST, { params: { id: "shared-list" } })).status).toBe(401);
    expect((await call(shareApi.POST, { user: friend, params: { id: "shared-list" } })).status).toBe(404);

    const shared = await call(shareApi.POST, { user: owner, params: { id: "shared-list" } });
    const slug = (shared.body as { shareSlug: string }).shareSlug;
    expect(slug).toMatch(/^[A-Za-z0-9_-]{16,}$/);
    expect((await call(shareApi.POST, { user: owner, params: { id: "shared-list" } })).body).toEqual({ shareSlug: slug });
    const ownerLists = (await call(listsApi.GET, { user: owner })).body as { id: string; shareSlug?: string }[];
    expect(ownerLists.find((list) => list.id === "shared-list")?.shareSlug).toBe(slug);

    const asGuest = await call(sharedApi.GET, { params: { slug } });
    expect(asGuest.status).toBe(200);
    const body = asGuest.body as { list: { name: string }; entries: { id: string }[]; isOwner: boolean };
    expect(body.list.name).toBe("Te delen");
    // The owner's private entry is readable through the share; someone else's private entry is not.
    expect(body.entries.map((entry) => entry.id)).toEqual([ownWord.id, "verb:essere"]);
    expect(body.isOwner).toBe(false);
    expect(((await call(sharedApi.GET, { user: owner, params: { slug } })).body as { isOwner: boolean }).isOwner).toBe(true);

    // It is not readable any other way.
    const friendEntries = (await call(entriesApi.GET, { user: friend })).body as { id: string }[];
    expect(friendEntries.some((entry) => entry.id === ownWord.id)).toBe(false);
    expect((await call(sharedApi.GET, { params: { slug: "not-a-real-slug-123456" } })).status).toBe(404);
  });

  it("copies a shared list so it survives unsharing and deletion of the original", async () => {
    const slug = ((await call(shareApi.POST, { user: owner, params: { id: "shared-list" } })).body as { shareSlug: string })
      .shareSlug;
    expect((await call(copyApi.POST, { params: { slug } })).status).toBe(401);
    expect((await call(copyApi.POST, { user: owner, params: { slug } })).status).toBe(400);

    const copied = await call(copyApi.POST, { user: friend, params: { slug } });
    expect(copied.status).toBe(201);
    const copy = copied.body as { id: string; entryRefs: { entryId: string }[] };
    expect(copy.entryRefs).toHaveLength(2);
    expect(copy.entryRefs[1]).toEqual({ entryId: "verb:essere" });
    const clonedId = copy.entryRefs[0].entryId;
    expect(clonedId).toMatch(/^word:[0-9a-f-]{36}$/);

    expect((await call(shareApi.DELETE, { user: friend, params: { id: "shared-list" } })).status).toBe(404);
    expect((await call(shareApi.DELETE, { user: owner, params: { id: "shared-list" } })).status).toBe(204);
    expect((await call(sharedApi.GET, { params: { slug } })).status).toBe(404);
    expect((await call(listApi.DELETE, { user: owner, params: { id: "shared-list" } })).status).toBe(204);

    const friendLists = (await call(listsApi.GET, { user: friend })).body as { id: string; entryRefs: unknown[] }[];
    expect(friendLists.find((list) => list.id === copy.id)?.entryRefs).toEqual(copy.entryRefs);
    const friendEntries = (await call(entriesApi.GET, { user: friend })).body as { id: string; it?: string }[];
    expect(friendEntries.find((entry) => entry.id === clonedId)).toMatchObject({ it: "segreto" });
  });
});
