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

## Development

Install dependencies and run the local app with Bun:

```sh
bun install
bun run dev
```

The development server is available at `http://localhost:5173` by default.

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
