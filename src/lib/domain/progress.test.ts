import { describe, expect, it } from "vitest";
import { isProgressEntry, mergeProgress } from "./progress";

const row = (last: number, box = 1) => ({ box, seen: 1, correct: 1, wrong: 0, last });

describe("progress merge", () => {
  it("keeps the row with the larger last per card", () => {
    const merged = mergeProgress({ a: row(10, 2), b: row(5) }, { a: row(5, 5), b: row(9, 3), c: row(1) });
    expect(merged).toEqual({ a: row(10, 2), b: row(9, 3), c: row(1) });
    expect(mergeProgress({ a: row(3, 2) }, { a: row(3, 4) }).a.box).toBe(2);
  });

  it("validates progress rows", () => {
    expect(isProgressEntry(row(1))).toBe(true);
    expect(isProgressEntry({ ...row(1), box: "2" })).toBe(false);
    expect(isProgressEntry({ box: 1 })).toBe(false);
    expect(isProgressEntry({ ...row(1), last: -1 })).toBe(false);
  });
});
