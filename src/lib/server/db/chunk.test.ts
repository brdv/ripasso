import { describe, expect, it } from "vitest";
import { chunkRows } from "./chunk";

describe("chunkRows", () => {
  it("keeps every chunk within 100 parameters", () => {
    const rows = Array.from({ length: 60 }, (_, i) => i);
    const chunks = chunkRows(rows, 4);
    expect(chunks.map((chunk) => chunk.length)).toEqual([25, 25, 10]);
    expect(chunks.flat()).toEqual(rows);
    expect(chunkRows([], 4)).toEqual([]);
  });
});
