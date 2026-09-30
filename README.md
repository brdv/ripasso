# Ripasso

Ripasso is a SvelteKit app for practising Italian vocabulary and verb conjugations. The built-in
deck is loaded from `static/data.json`; study progress is kept locally in the browser. There is no
database or account system yet.

## Features

- Practise verb conjugations and vocabulary in both directions, with a simple Leitner-box review
  or a free session, graded directly or afterwards "on paper".
- **Practice lists.** "Lijsten beheren" in the menu opens an overview where you create, rename,
  and delete lists and add or remove words and verbs through a search box. The "Oefenen uit"
  select in the menu picks the whole dataset or one list; the menu's content and tense filters
  still apply. Lists are stored in the browser (`ripasso_lists_v1`).
- **Own words.** "Mijn woorden" (from the lists overview) and "Nieuw woord" (in the list editor)
  let you add your own words with word type and, for nouns, article, gender, and number. They
  behave like built-in words, are marked "eigen" in the list editor, and are stored in the
  browser (`ripasso_entries_v1`). Built-in words cannot be edited.
- **Own verbs.** "Nieuw werkwoord" adds a verb with auxiliary, conjugation group, regularity, a
  note, and any subset of the tense × person grid. Every filled cell needs both the Italian and
  the Dutch form; a session only produces cards for the cells you filled.

## Development

Install dependencies and run the local app with Bun:

```sh
bun install
bun run dev
```

The development server is available at `http://localhost:5173` by default.

### Database

The server side uses Cloudflare D1 through Drizzle ORM. `wrangler.jsonc` binds a D1 database as
`DB`; locally it lives in `.wrangler/` (gitignored) and needs no Cloudflare account.

```sh
bun run db:migrate:local   # create or update the local database, including the base content
bun run db:generate        # after editing src/lib/server/db/schema.ts: write a new migration
bun run db:seed            # after editing static/data.json: regenerate migrations/0001_seed.sql
```

The schema is in `src/lib/server/db/schema.ts` and migrations are SQL files in `migrations/`.
The seed migration inserts every built-in entry and a "Basis" list containing all of them, owned
by the `system` user. Row mapping (`entryToRow` / `rowToEntry`) is in `src/lib/server/db/`.

## Verification

```sh
bun run lint
bun run check
bun run test
bun run test:e2e
bun run build
```

The end-to-end tests require Playwright's Chromium binary. Install it once with:

```sh
bunx playwright install chromium
```

The production build uses SvelteKit's Cloudflare adapter, but the application currently needs no
Cloudflare services at runtime.

## Deployment

Deployment is done by a human; agents never touch remote Cloudflare resources. Before the app is
deployed with the database:

1. Create the database with `wrangler d1 create ripasso` and put the returned ID in
   `database_id` in `wrangler.jsonc` (the committed value is a placeholder). If the app is
   deployed with Cloudflare Pages, also bind the database as `DB` in the Pages project settings.
2. Apply migrations remotely: `wrangler d1 migrations apply ripasso --remote`.
3. Deploy to Cloudflare.

## CI

`.github/workflows/ci.yml` runs on every pull request and on pushes to `main`. A single job on
`ubuntu-latest` installs dependencies with Bun 1.4.2 (`bun install --frozen-lockfile`), installs
Playwright's Chromium (cached per Playwright version), and then runs `bun run lint`,
`bun run check`, `bun run test`, `bun run test:e2e -- --workers=1`, and `bun run build` as
separate steps. When a step fails, the Playwright report and test results are uploaded as the
`playwright-results` artifact. A newer run on the same branch cancels the one in progress.

## Roadmap

Planned work and its design decisions are in [`docs/roadmap.md`](docs/roadmap.md). Coding agents
follow [`AGENTS.md`](AGENTS.md); running the roadmap with cloud agents is described in
[`docs/cloud-agent-setup.md`](docs/cloud-agent-setup.md).
