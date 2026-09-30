import { clearSrs, loadSrs, saveSrs, type StorageLike } from "$lib/domain/srs";
import type { Progress, ProgressEntry } from "$lib/domain/types";
import type { ProgressRepository } from "./types";

/** Guest progress in `ripasso_progress_v2`, through the existing `srs.ts` storage helpers. */
export class LocalProgressRepository implements ProgressRepository {
  ok = true;
  private progress: Progress = {};

  constructor(private readonly storage: StorageLike) {}

  async load(): Promise<Progress> {
    const loaded = loadSrs(this.storage);
    this.progress = loaded.progress;
    this.ok = loaded.ok;
    return this.progress;
  }

  async record(cardId: string, entry: ProgressEntry): Promise<void> {
    this.progress = { ...this.progress, [cardId]: entry };
    this.ok = saveSrs(this.progress, this.storage);
    if (!this.ok) throw new Error("Opslaan in deze browser lukte niet.");
  }

  async clear(): Promise<void> {
    this.progress = {};
    this.ok = clearSrs(this.storage);
    if (!this.ok) throw new Error("Wissen in deze browser lukte niet.");
  }
}
