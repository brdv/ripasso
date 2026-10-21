import { describe, expect, it } from "vitest";
import { parseRich } from "./rich-text";

describe("rich text", () => {
  it("parses nested marks", () => {
    expect(parseRich("**-isc-** bij _fin{isc}[o]_.")).toEqual([
      { mark: "bold", children: ["-isc-"] },
      " bij ",
      { mark: "italian", children: ["fin", { mark: "change", children: ["isc"] }, { mark: "ending", children: ["o"] }] },
      ".",
    ]);
  });

  it("keeps an unclosed mark as plain text", () => {
    expect(parseRich("_open en [dicht")).toEqual(["_open en [dicht"]);
  });
});
