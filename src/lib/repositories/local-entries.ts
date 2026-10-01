import type { StorageLike } from "$lib/domain/srs";
import type { EntryId, StudyEntry } from "$lib/domain/types";
import type { EntryRepository } from "./types";

export const ENTRIES_KEY = "ripasso_entries_v1";

type StoredEntry = StudyEntry & { origin: "custom" };

interface StoredEntries {
  version: 1;
  entries: StoredEntry[];
}

/**
 * Shared entries plus the guest's own entries from browser storage. The `origin` marker exists
 * only in storage; entries handed out are plain `StudyEntry` values.
 */
export class LocalEntryRepository implements EntryRepository {
  ok = true;
  private readonly sharedIds: Set<EntryId>;

  constructor(
    private readonly shared: StudyEntry[],
    private readonly storage: StorageLike,
  ) {
    this.sharedIds = new Set(shared.map((entry) => entry.id));
  }

  async list(): Promise<StudyEntry[]> {
    return [...this.shared, ...this.read()];
  }

  async listOwn(): Promise<StudyEntry[]> {
    return this.read();
  }

  async save(entry: StudyEntry): Promise<void> {
    if (this.sharedIds.has(entry.id)) throw new Error("Gedeelde woorden kun je niet aanpassen.");
    const entries = this.read();
    const index = entries.findIndex((existing) => existing.id === entry.id);
    if (index === -1) entries.push(entry);
    else entries[index] = entry;
    this.write(entries);
  }

  async remove(id: EntryId): Promise<void> {
    if (this.sharedIds.has(id)) throw new Error("Gedeelde woorden kun je niet verwijderen.");
    this.write(this.read().filter((entry) => entry.id !== id));
  }

  private read(): StudyEntry[] {
    try {
      const raw = this.storage.getItem(ENTRIES_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw) as Partial<StoredEntries> | null;
      if (parsed && parsed.version === 1 && Array.isArray(parsed.entries)) {
        const valid = parsed.entries.filter(
          (entry) => isStudyEntry(entry) && !this.sharedIds.has(entry.id),
        );
        if (valid.length !== parsed.entries.length) this.ok = false;
        return valid.map(stripOrigin);
      }
    } catch {
      // Fall through: unparsable data counts as empty.
    }
    this.ok = false;
    return [];
  }

  private write(entries: StudyEntry[]): void {
    const data: StoredEntries = {
      version: 1,
      entries: entries.map((entry) => ({ ...entry, origin: "custom" })),
    };
    try {
      this.storage.setItem(ENTRIES_KEY, JSON.stringify(data));
      this.ok = true;
    } catch (error) {
      this.ok = false;
      throw error;
    }
  }
}

function stripOrigin(stored: StoredEntry): StudyEntry {
  const entry: Partial<StoredEntry> = { ...stored };
  delete entry.origin;
  return entry as StudyEntry;
}

function isStudyEntry(value: unknown): value is StoredEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  if (typeof entry.id !== "string" || typeof entry.nl !== "string") return false;
  if (entry.type === "word") return typeof entry.it === "string";
  if (entry.type === "verb") return typeof entry.lemma === "string";
  return false;
}
