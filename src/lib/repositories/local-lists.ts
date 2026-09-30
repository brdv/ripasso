import { isPracticeList } from "$lib/domain/lists";
import type { StorageLike } from "$lib/domain/srs";
import type { PracticeList } from "$lib/domain/types";
import type { ListRepository } from "./types";

export const LISTS_KEY = "ripasso_lists_v1";

interface StoredLists {
  version: 1;
  lists: PracticeList[];
}

/**
 * Lists stored in the browser. Unreadable data is treated as empty and flips `ok` to false so the
 * UI can show the storage warning; failed writes reject and also flip `ok`.
 */
export class LocalListRepository implements ListRepository {
  ok = true;

  constructor(private readonly storage: StorageLike) {}

  async list(): Promise<PracticeList[]> {
    return this.read();
  }

  async save(list: PracticeList): Promise<void> {
    const lists = this.read();
    const index = lists.findIndex((existing) => existing.id === list.id);
    if (index === -1) lists.push(list);
    else lists[index] = list;
    this.write(lists);
  }

  async remove(id: string): Promise<void> {
    this.write(this.read().filter((list) => list.id !== id));
  }

  private read(): PracticeList[] {
    try {
      const raw = this.storage.getItem(LISTS_KEY);
      if (!raw) return [];

      const parsed: unknown = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed === "object" &&
        (parsed as StoredLists).version === 1 &&
        Array.isArray((parsed as StoredLists).lists)
      ) {
        const lists = (parsed as StoredLists).lists.filter(isPracticeList);
        if (lists.length !== (parsed as StoredLists).lists.length) this.ok = false;
        return lists;
      }
    } catch {
      // Fall through: unparsable data counts as empty.
    }
    this.ok = false;
    return [];
  }

  private write(lists: PracticeList[]): void {
    const data: StoredLists = { version: 1, lists };
    try {
      this.storage.setItem(LISTS_KEY, JSON.stringify(data));
      this.ok = true;
    } catch (error) {
      this.ok = false;
      throw error;
    }
  }
}
