import type { Progress, ProgressEntry } from "./types";

export const SRS_KEY = "ripasso_progress_v2";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function boxOf(progress: Progress, id: string): number {
  return progress[id]?.box ?? 1;
}

export function record(progress: Progress, id: string, ok: boolean, now = Date.now()): Progress {
  const current: ProgressEntry = progress[id] ?? {
    box: 1,
    seen: 0,
    correct: 0,
    wrong: 0,
    last: 0,
  };

  return {
    ...progress,
    [id]: {
      ...current,
      seen: current.seen + 1,
      correct: current.correct + (ok ? 1 : 0),
      wrong: current.wrong + (ok ? 0 : 1),
      box: ok ? Math.min(5, current.box + 1) : 1,
      last: now,
    },
  };
}

export function loadSrs(storage: StorageLike): { progress: Progress; ok: boolean } {
  try {
    const raw = storage.getItem(SRS_KEY);
    if (!raw) return { progress: {}, ok: true };

    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? { progress: parsed as Progress, ok: true }
      : { progress: {}, ok: false };
  } catch {
    return { progress: {}, ok: false };
  }
}

export function saveSrs(progress: Progress, storage: StorageLike): boolean {
  try {
    storage.setItem(SRS_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function clearSrs(storage: StorageLike): boolean {
  try {
    storage.removeItem(SRS_KEY);
    return true;
  } catch {
    return false;
  }
}
