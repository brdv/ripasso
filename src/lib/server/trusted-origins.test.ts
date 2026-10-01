import { describe, expect, it } from "vitest";
import { trustedOrigins } from "./trusted-origins";

describe("trustedOrigins", () => {
  it("adds configured extra origins and dev origins", () => {
    expect(trustedOrigins("https://ripasso.pages.dev", undefined, false)).toEqual(["https://ripasso.pages.dev"]);
    expect(
      trustedOrigins("https://ripasso.pages.dev", " https://*.ripasso.pages.dev, ,https://example.com ", false),
    ).toEqual(["https://ripasso.pages.dev", "https://*.ripasso.pages.dev", "https://example.com"]);
    expect(trustedOrigins("http://localhost:5173", "", true)).toContain("http://127.0.0.1:5173");
  });
});
