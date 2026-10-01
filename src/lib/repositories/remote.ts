import type { EntryId, PracticeList, Progress, ProgressEntry, StudyEntry } from "$lib/domain/types";
import type { EntryRepository, ListRepository, ProgressRepository } from "./types";

type Fetch = typeof fetch;

async function send(fetcher: Fetch, url: string, method: string, body?: unknown): Promise<Response> {
  const response = await fetcher(url, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${method} ${url} mislukte: HTTP ${response.status}`);
  return response;
}

/**
 * Runs writes one after another. The UI saves optimistically without awaiting, so without this
 * two quick edits could reach the server out of order and the older one would win.
 */
class WriteQueue {
  private tail: Promise<unknown> = Promise.resolve();

  run<T>(task: () => Promise<T>): Promise<T> {
    const result = this.tail.then(task, task);
    this.tail = result.catch(() => undefined);
    return result;
  }
}

/**
 * Server-backed repositories for logged-in users. `save` creates with POST the first time an ID
 * is seen and updates with PUT afterwards.
 */
export class RemoteListRepository implements ListRepository {
  private readonly known = new Set<string>();
  private readonly writes = new WriteQueue();

  constructor(private readonly fetcher: Fetch = fetch) {}

  async list(): Promise<PracticeList[]> {
    const lists = (await (await send(this.fetcher, "/api/lists", "GET")).json()) as PracticeList[];
    for (const list of lists) this.known.add(list.id);
    return lists;
  }

  save(list: PracticeList): Promise<void> {
    return this.writes.run(async () => {
      const body = { id: list.id, name: list.name, entryRefs: list.entryRefs };
      if (this.known.has(list.id)) {
        await send(this.fetcher, `/api/lists/${encodeURIComponent(list.id)}`, "PUT", body);
      } else {
        await send(this.fetcher, "/api/lists", "POST", body);
        this.known.add(list.id);
      }
    });
  }

  remove(id: string): Promise<void> {
    return this.writes.run(async () => {
      await send(this.fetcher, `/api/lists/${encodeURIComponent(id)}`, "DELETE");
      this.known.delete(id);
    });
  }

  /** Shares a list by link and returns its slug. Server-only, so not part of `ListRepository`. */
  share(id: string): Promise<string> {
    return this.writes.run(async () => {
      const response = await send(this.fetcher, `/api/lists/${encodeURIComponent(id)}/share`, "POST");
      return ((await response.json()) as { shareSlug: string }).shareSlug;
    });
  }

  unshare(id: string): Promise<void> {
    return this.writes.run(async () => {
      await send(this.fetcher, `/api/lists/${encodeURIComponent(id)}/share`, "DELETE");
    });
  }
}

export class RemoteEntryRepository implements EntryRepository {
  private readonly known = new Set<EntryId>();
  private readonly writes = new WriteQueue();

  constructor(private readonly fetcher: Fetch = fetch) {}

  async list(): Promise<StudyEntry[]> {
    return (await (await send(this.fetcher, "/api/entries", "GET")).json()) as StudyEntry[];
  }

  async listOwn(): Promise<StudyEntry[]> {
    const own = (await (await send(this.fetcher, "/api/entries?scope=own", "GET")).json()) as StudyEntry[];
    for (const entry of own) this.known.add(entry.id);
    return own;
  }

  save(entry: StudyEntry): Promise<void> {
    return this.writes.run(async () => {
      if (this.known.has(entry.id)) {
        await send(this.fetcher, `/api/entries/${encodeURIComponent(entry.id)}`, "PUT", entry);
      } else {
        await send(this.fetcher, "/api/entries", "POST", entry);
        this.known.add(entry.id);
      }
    });
  }

  remove(id: EntryId): Promise<void> {
    return this.writes.run(async () => {
      await send(this.fetcher, `/api/entries/${encodeURIComponent(id)}`, "DELETE");
      this.known.delete(id);
    });
  }
}

export class RemoteProgressRepository implements ProgressRepository {
  constructor(private readonly fetcher: Fetch = fetch) {}

  async load(): Promise<Progress> {
    return (await (await send(this.fetcher, "/api/progress", "GET")).json()) as Progress;
  }

  async record(cardId: string, entry: ProgressEntry): Promise<void> {
    await send(this.fetcher, `/api/progress/${encodeURIComponent(cardId)}`, "PUT", entry);
  }

  async clear(): Promise<void> {
    await send(this.fetcher, "/api/progress", "DELETE");
  }
}
