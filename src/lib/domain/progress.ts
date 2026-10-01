import type { Progress, ProgressEntry } from "./types";

export function isProgressEntry(value: unknown): value is ProgressEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (["box", "seen", "correct", "wrong", "last"] as const).every(
    (key) => typeof entry[key] === "number" && Number.isFinite(entry[key]) && (entry[key] as number) >= 0,
  );
}

/** Merges two progress maps per card: the row with the larger `last` wins; ties keep `current`. */
export function mergeProgress(current: Progress, incoming: Progress): Progress {
  const merged: Progress = { ...current };
  for (const [cardId, entry] of Object.entries(incoming)) {
    if (!merged[cardId] || entry.last > merged[cardId].last) merged[cardId] = entry;
  }
  return merged;
}
