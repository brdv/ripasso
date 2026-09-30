import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { D1Database } from "@cloudflare/workers-types";
import { getPlatformProxy } from "wrangler";

/**
 * A local D1 database for integration tests: wrangler's platform proxy (Miniflare) persisting to
 * a fresh temporary directory, with every migration in `migrations/` applied in order.
 */
export async function createTestDatabase() {
  const persistTo = mkdtempSync(join(tmpdir(), "ripasso-d1-"));
  const proxy = await getPlatformProxy<{ DB: D1Database }>({
    configPath: "wrangler.jsonc",
    persist: { path: persistTo },
  });
  const d1 = proxy.env.DB;

  const files = readdirSync("migrations")
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const statements = readFileSync(join("migrations", file), "utf8")
      .split("--> statement-breakpoint")
      .map((statement) => statement.replace(/^\s*--.*$/gm, "").trim())
      .filter(Boolean);
    if (statements.length > 0) await d1.batch(statements.map((statement) => d1.prepare(statement)));
  }

  return {
    d1,
    async dispose() {
      await proxy.dispose();
      rmSync(persistTo, { recursive: true, force: true });
    },
  };
}
