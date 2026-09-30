import type { StorageLike } from "$lib/domain/srs";
import { LocalEntryRepository } from "./local-entries";
import { LocalListRepository } from "./local-lists";
import { LocalProgressRepository } from "./local-progress";

export const SYNC_KEY = "ripasso_sync_v1";

interface SyncRecord {
  version: 1;
  imported: Record<string, number>;
}

function readSync(storage: StorageLike): SyncRecord {
  try {
    const parsed = JSON.parse(storage.getItem(SYNC_KEY) ?? "null") as Partial<SyncRecord> | null;
    if (parsed?.version === 1 && parsed.imported && typeof parsed.imported === "object") {
      return { version: 1, imported: { ...parsed.imported } };
    }
  } catch {
    // Unreadable sync data counts as "nothing imported yet"; the import itself is idempotent.
  }
  return { version: 1, imported: {} };
}

export function hasImported(storage: StorageLike, userId: string): boolean {
  return userId in readSync(storage).imported;
}

/**
 * Imports this browser's guest entries, lists, and progress into the account once, in a single
 * request. The guest data itself is left in place.
 */
export async function importGuestDataOnce(
  storage: StorageLike,
  userId: string,
  fetcher: typeof fetch = fetch,
  now = Date.now(),
): Promise<boolean> {
  if (hasImported(storage, userId)) return false;

  const [entries, lists, progress] = await Promise.all([
    // Shared entries are not needed to read the guest's own ones.
    new LocalEntryRepository([], storage).listOwn(),
    new LocalListRepository(storage).list(),
    new LocalProgressRepository(storage).load(),
  ]);

  if (entries.length > 0 || lists.length > 0 || Object.keys(progress).length > 0) {
    const response = await fetcher("/api/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entries, lists, progress }),
    });
    if (!response.ok) throw new Error(`Importeren mislukte: HTTP ${response.status}`);
  }

  const record = readSync(storage);
  record.imported[userId] = now;
  storage.setItem(SYNC_KEY, JSON.stringify(record));
  return true;
}
