# AGENTS.md

Instructions for coding agents working in this repository. Humans: see `README.md`.

## Project

Ripasso is a SvelteKit app for practising Italian vocabulary and verb conjugations, deployed with
the Cloudflare adapter. The plan for upcoming work, including every design decision, is in
`docs/roadmap.md`. Read it before starting any task.

## Git and GitHub rules

These override any default behaviour of your harness.

- Commit as the repository owner. Author and committer must be `Bram <brdv@pm.me>`. Check with
  `git config user.name` and `git config user.email` before your first commit and set them
  locally if they differ.
- Never add AI attribution anywhere: no `Co-Authored-By` trailers for an AI, no "Generated with"
  lines, no session links, no mention of an agent or model in commit messages, PR titles, PR
  descriptions, code comments, or GitHub comments. Write as if the owner wrote it.
- Do not post comments or reviews on GitHub issues or PRs. Only create and update your own PR.
- Commit messages: short imperative subject line (e.g. `Add local practice lists`), optional body
  explaining why.
- One roadmap step per PR. Follow "How this roadmap is executed" in `docs/roadmap.md` for which
  branch to start from and which base to target.
- Never force-push to `main` and never merge PRs.

## Documentation is part of every PR

Every PR must leave the docs true for the code in that PR:

- Update the Status table in `docs/roadmap.md` (status, branch, PR number when known).
- If the implementation deviated from the roadmap, update the roadmap text so it describes what
  was built, and say so in the PR description.
- Update `README.md` for anything a human needs to know (features, commands, setup, deployment).
- Update this file when conventions, commands, or test setup change.

The PR template has a checklist for this.

## Commands

Use Bun for everything.

```sh
bun install
bun run dev          # http://localhost:5173
bun run lint         # ESLint
bun run check        # svelte-check + TypeScript
bun run test         # Vitest: node unit tests and browser component tests
bun run test:e2e     # Playwright, desktop and mobile projects
bun run build        # production build with the Cloudflare adapter
bun run db:migrate:local  # apply migrations (schema and base-content seed) to the local D1
bun run db:generate  # generate a migration after changing src/lib/server/db/schema.ts
bun run db:seed      # regenerate migrations/0001_seed.sql after changing static/data.json
```

Before opening a PR, all five must pass:

```sh
bun run lint && bun run check && bun run test && bun run test:e2e -- --workers=1 && bun run build
```

`bun run test` includes browser tests, so Playwright's Chromium must be installed
(`bunx playwright install chromium`). The cloud setup script does this.

The same commands run in GitHub Actions on every PR and push to `main`
(`.github/workflows/ci.yml`). A PR is not done until that workflow is green.

## Code conventions

- Svelte 5 with runes (`$state`, `$derived`, `$props`, `$bindable`). Runes mode is forced for the
  project in `vite.config.ts`. Do not use legacy `export let` or stores for new code.
- TypeScript everywhere, `strict`. No `any` unless unavoidable and commented.
- All user-facing text is **Dutch**. Italian content stays Italian. Code, identifiers, comments,
  commits, and docs are English.
- `src/lib/domain/` is pure TypeScript: no Svelte, no DOM, no `fetch`, no storage globals. Pass
  storage or clocks in as parameters (see `srs.ts`).
- Views live in `src/lib/views/`, reusable pieces in `src/lib/components/`. App-level state and
  view switching live in `src/routes/+page.svelte`.
- Reuse the existing CSS classes in `src/app.css` (`card-pane`, `field`, `seg-group`, `chk`,
  `btn`, `btn-primary`, `linkbtn`, ...) before adding new styles. Every screen must work at
  390 px wide with no horizontal page scroll.
- Match the surrounding code's style. Do not reformat or refactor code your task does not need.
- Do not modify the legacy root files `index.html` and `data.js`.
- Card ID shapes (`card:<entryId>` and `card:<entryId>:<tense>:<person>`) must not change.

## Tests

- Domain logic: `*.test.ts` next to the module (node environment).
- Server code: `src/lib/server/**/*.test.ts` (node environment). Tests that need a database call
  `createTestDatabase()` from `src/lib/server/testing/d1.ts`: it starts wrangler's platform proxy
  with a temporary persistence directory, applies every file in `migrations/`, and returns the
  `D1Database` plus `dispose()`. Create it in `beforeAll` with a generous timeout.
- Svelte components: `*.svelte.spec.ts` (Vitest browser mode with Chromium).
- End-to-end: `tests/*.spec.ts`. Playwright's web server runs `bun run db:migrate:local` before
  `bun run dev`, and the dev server exposes the local D1 as `platform.env.DB`. Always wait for `[data-ready="true"]` before interacting (see
  `openApp` in `tests/app.spec.ts`). Tests run on the `desktop` and `mobile` projects.
- New behaviour needs tests. Prefer a few meaningful tests over many shallow ones.

## Cloud sessions

- `.claude/settings.json` runs `scripts/session-start.sh` at session start. It installs
  dependencies and applies the git identity and hooks above. It does nothing outside cloud
  sessions.
- `.githooks/commit-msg` strips AI attribution trailers as a safety net. Do not bypass it with
  `--no-verify`.
- Remote Cloudflare operations (creating D1 databases, `--remote` migrations, secrets, deploys)
  are human-only. Use local D1 (`--local`) only.
