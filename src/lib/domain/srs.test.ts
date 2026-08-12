import { describe, expect, it } from "vitest";
import { boxOf, loadSrs, record, saveSrs, SRS_KEY } from "./srs";
import type { Progress } from "./types";

describe("SRS progress", () => {
  it("moves correct answers up to box five and wrong answers back to box one", () => {
    let progress: Progress = {};
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      progress = record(progress, "word:cosa", true, attempt * 100);
    }

    expect(boxOf(progress, "word:cosa")).toBe(5);
    progress = record(progress, "word:cosa", false, 600);
    expect(progress["word:cosa"]).toMatchObject({ box: 1, seen: 6, correct: 5, wrong: 1 });
  });

  it("round-trips progress through browser-like storage", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
      removeItem: (key: string) => void values.delete(key),
    };
    const progress = record({}, "word:cosa", true, 100);

    expect(saveSrs(progress, storage)).toBe(true);
    expect(values.has(SRS_KEY)).toBe(true);
    expect(loadSrs(storage)).toEqual({ progress, ok: true });
  });

  it("recovers from malformed stored data", () => {
    const storage = {
      getItem: () => "not-json",
      setItem: () => undefined,
      removeItem: () => undefined,
    };

    expect(loadSrs(storage)).toEqual({ progress: {}, ok: false });
  });
});
