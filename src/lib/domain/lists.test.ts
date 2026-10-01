import { describe, expect, it } from "vitest";
import {
  addEntry,
  createList,
  formatListCounts,
  isPracticeList,
  listCounts,
  removeEntry,
  renameList,
} from "./lists";
import type { StudyEntry } from "./types";

const entries: StudyEntry[] = [
  { id: "verb:essere", type: "verb", lemma: "essere", nl: "zijn" },
  { id: "verb:avere", type: "verb", lemma: "avere", nl: "hebben" },
  { id: "word:cosa", type: "word", it: "cosa", nl: "ding" },
];

describe("practice lists", () => {
  it("creates lists with a trimmed name and rejects empty names", () => {
    expect(createList("  Week 1 ", "list-1")).toEqual({
      id: "list-1",
      name: "Week 1",
      entryRefs: [],
    });
    expect(createList("Week 2").id).toMatch(/^[0-9a-f-]{36}$/);
    expect(() => createList("   ")).toThrow();
    expect(() => renameList(createList("A"), "")).toThrow();
    expect(renameList(createList("A", "x"), " B ").name).toBe("B");
  });

  it("adds each entry at most once and removes it again", () => {
    let list = createList("Week 1", "list-1");
    list = addEntry(list, "verb:essere");
    const again = addEntry(list, "verb:essere");

    expect(again).toBe(list);
    expect(list.entryRefs).toEqual([{ entryId: "verb:essere" }]);
    expect(removeEntry(list, "verb:essere").entryRefs).toEqual([]);
    expect(removeEntry(list, "verb:avere")).toBe(list);
  });

  it("counts only resolvable entries", () => {
    let list = createList("Week 1", "list-1");
    for (const id of ["verb:essere", "word:cosa", "word:gone"]) list = addEntry(list, id);

    const counts = listCounts(list, entries);
    expect(counts).toEqual({ verbs: 1, words: 1 });
    expect(formatListCounts(counts)).toBe("1 werkwoord · 1 woord");
    expect(formatListCounts({ verbs: 2, words: 0 })).toBe("2 werkwoorden · 0 woorden");
  });

  it("recognises valid stored lists", () => {
    expect(isPracticeList({ id: "a", name: "A", entryRefs: [{ entryId: "x" }] })).toBe(true);
    expect(isPracticeList({ id: "a", name: "A", entryRefs: [{}] })).toBe(false);
    expect(isPracticeList({ id: "a", name: "A" })).toBe(false);
    expect(isPracticeList(null)).toBe(false);
  });
});
