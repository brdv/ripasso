# Ripasso roadmap and implementation guide

This is the single source of truth for the work that follows the Svelte migration and the
repository-neutral data model. It is written so that a coding agent can implement each step as
one pull request without further conversation. Humans review and merge.

Read `AGENTS.md` first for conventions, verification commands, and git rules.

## Status

Every PR updates this table as part of its own diff: set its row to `in review`, fill in the
branch name, and correct anything below that the implementation made untrue.

| #   | Step                                   | Status      | Branch | PR  |
| --- | -------------------------------------- | ----------- | ------ | --- |
| 0   | Agent setup, roadmap, and docs         | merged      | `prep/agent-setup` | #2  |
| 1   | Local practice lists                   | in review   | `claude/roadmap-step-1-local-lists` | #4  |
| 2   | Custom words (local)                   | in review   | `claude/roadmap-step-2-custom-words` | #5  |
| 3   | Custom verbs (local)                   | in review   | `claude/roadmap-step-3-custom-verbs` | #6  |
| 4   | D1 schema, migrations, and seed        | in review   | `claude/roadmap-step-4-d1-schema` | #7  |
| 5   | Server repositories and entries API    | in review   | `claude/roadmap-step-5-entries-api` | #8  |
| 6   | Accounts                               | in review   | `claude/roadmap-step-6-accounts` | #9  |
| 7   | Guest-to-account sync                  | in review   | `claude/roadmap-step-7-sync` | #10 |
| 8   | Sharing lists                          | in review   | `claude/roadmap-step-8-sharing` |     |
| 9   | Cleanup and final docs pass            | not started |        |     |

Status values: `not started`, `in progress`, `in review`, `merged`.

## How this roadmap is executed

The steps form a **stack of pull requests**. Each step is one PR whose base is the branch of the
step before it; step 1 is based on `main`.

- One cloud session implements one step. It starts from the previous step's branch (see the
  Status table on that branch), works on its own branch, and opens a PR with
  `--base <previous step's branch>`.
- A session implements exactly one step. It does not start the next one.
- A PR must pass all verification commands in `AGENTS.md` before it is opened.
- If the acceptance criteria of a step turn out to conflict with each other or with the existing
  code, stop and ask in the session instead of guessing. Everything else has a decision below;
  follow it.
- Merging is done by a human, bottom-up. After a lower PR merges, the next PR is retargeted to
  `main`.

Kickoff prompt for a step (replace `N` and the branch):

> Read `AGENTS.md` and `docs/roadmap.md`. You are implementing step N. Start from branch
> `<previous branch>`. Implement only step N, update the docs as the roadmap requires, verify with
> every command in `AGENTS.md`, then open a PR against `<previous branch>`.

## Product direction

Users can create named practice lists, fill them with shared words and verbs and with their own
entries, practise only a selected list, and share lists with others. A list contains **source
entries**, not flashcards: adding the verb `essere` adds one entry, which a session expands into
cards for the enabled tenses and persons.

## Architecture principles

These hold for every step.

1. **Entries are repository-neutral.** Session and card code only ever sees `StudyEntry[]`. It
   never asks where an entry came from. Built-in and custom content differ only in persistence
   metadata (owner, visibility), never in type or ID shape.
2. **Lists reference entries** via `EntryReference { entryId }`. Resolving a list against the
   available entries silently drops references that no longer resolve.
3. **Cards are derived.** `expandEntriesToCards` stays the only place that turns entries into
   cards. Progress is keyed by card ID (`card:<entryId>` or `card:<entryId>:<tense>:<person>`).
   Do not change card ID shapes: progress would be lost.
4. **Domain code is pure.** `src/lib/domain/` has no Svelte, no `window`, no `fetch`. Storage and
   network code live in `src/lib/repositories/` (client) and `src/lib/server/` (server).
5. **Repository boundary.** Persistence goes through small interfaces so local storage and the
   server are interchangeable:

   ```ts
   interface EntryRepository {
     list(): Promise<StudyEntry[]>; // everything the current user may practise
     listOwn(): Promise<StudyEntry[]>; // the current user's own, editable entries (step 2)
     save(entry: StudyEntry): Promise<void>; // own entries only
     remove(id: EntryId): Promise<void>;
   }

   interface ListRepository {
     list(): Promise<PracticeList[]>;
     save(list: PracticeList): Promise<void>;
     remove(id: string): Promise<void>;
   }

   interface ProgressRepository {
     load(): Promise<Progress>;
     record(cardId: string, entry: ProgressEntry): Promise<void>;
     clear(): Promise<void>;
   }
   ```

   Introduce each interface in the step that first needs it (lists in step 1, entries in step 2,
   progress in step 7). Keep them this small; add methods only when a step needs one.
6. **Local-first guests.** A guest (not logged in) uses the app entirely from local storage,
   forever. Accounts add server persistence; they never become a requirement for practising.
7. **Versioned local storage.** Each local-storage key holds `{ "version": 1, ... }` and is read
   defensively: invalid or unparsable data is treated as empty and the UI shows the existing
   storage warning pattern instead of crashing.

## Decisions log

Decisions made up front so the stack can run unattended. Items marked **revisit** are deliberate
placeholders a human may change later; implement them as written.

| Area | Decision |
| ---- | -------- |
| List selector | A "Oefenen uit" select at the top of the menu: "Hele dataset" plus one option per list. Not persisted; defaults to "Hele dataset". **revisit** |
| List management | A separate "lists" view (overview) and "list-editor" view, reached from a "Lijsten beheren" button in the menu. Views stay in-page state like the existing ones, no new routes. |
| Menu filters on lists | Werkwoorden/Woorden checkboxes and tense toggles still apply to list sessions. An empty result shows the existing menu warning. |
| Empty lists | Allowed. Starting one shows the menu warning. |
| Local storage keys | `ripasso_lists_v1`, `ripasso_entries_v1`, `ripasso_sync_v1`. Progress stays in `ripasso_progress_v2`. |
| New IDs | Lists: `crypto.randomUUID()`. Custom entries: `word:<uuid>` / `verb:<uuid>`. Base entries keep their existing IDs (`word:<it>`, `verb:<lemma>`). |
| Custom verb editor | A tense × person grid; each cell has an Italian and a Dutch field. Every cell is optional; a cell must have both or neither; at least one complete cell is required. **revisit** |
| Deleting a custom entry | Allowed with confirmation. References to it in lists are left in place and resolve to nothing. Progress rows are left in place. |
| Database | Cloudflare D1 via Drizzle ORM. Migrations are SQL files in `migrations/`, applied with `wrangler d1 migrations apply`. |
| Entry storage | One `entries` table with shared columns plus a JSON `data` column holding the type-specific fields, including verb forms. **revisit** once querying individual forms matters. |
| Base content owner | A `system` owner ID. Base entries and the base list are owned by `system` with `public` visibility. A real super-admin account can be mapped onto it later. **revisit** |
| Base list visibility | The base list "Basis" is served only to logged-in users (from `GET /api/lists`), marked read-only. Guests keep "Hele dataset", which has the same content. |
| Auth | Better Auth with email and password, stored in D1. No email verification, no OAuth, no password reset flow yet. **revisit** |
| Sessions after login | Logged-in users read and write through the server. Local storage is not used as an offline cache for logged-in users yet. **revisit** |
| First login sync | Local lists and custom entries are imported once per account per browser. Progress merges per card: the row with the larger `last` wins. |
| Logout | Keeps the browser's guest data untouched. |
| Sharing model | Lists are `private` or `unlisted`. Sharing creates an unguessable slug and the URL `/l/<slug>`. Anyone with the link can practise it live; logged-in users can also copy it. No public browsing. |
| Copying a shared list | Public entries are referenced as-is. The owner's non-public entries are cloned into the copier's account as new entries with new IDs. |
| Progress on shared lists | Always personal. Guests practising a shared list store progress locally. |
| Deploy | Humans only. Agents never run remote wrangler commands, create Cloudflare resources, or set secrets. |

## Step 1 — Local practice lists

**Goal:** create a list, add or remove shared entries, and practise only that list. Everything is
stored locally.

In scope:

- `src/lib/domain/lists.ts`: pure functions `createList(name)`, `renameList`, `addEntry`,
  `removeEntry`, `listCounts(list, entries)` returning verb and word counts of resolvable entries.
  Adding an entry that is already present is a no-op. Names are trimmed and must not be empty.
- `src/lib/repositories/local-lists.ts`: `ListRepository` backed by `ripasso_lists_v1`
  (`{ version: 1, lists: PracticeList[] }`), taking a storage object like `srs.ts` does so it is
  unit-testable.
- Menu: the "Oefenen uit" select and a "Lijsten beheren" button.
- Lists view: all lists with name and "X werkwoorden · Y woorden", a "Nieuwe lijst" action (a
  name field; creating a list opens it in the editor), and per list "Bewerken" and "Verwijderen"
  (with `window.confirm`). Unreadable list storage shows the storage warning here.
- List editor view: rename field, a search box that filters available entries by Italian, Dutch,
  or lemma (case- and accent-insensitive, `src/lib/domain/search.ts`), and an add/remove toggle
  per entry. The list's current entries are shown first. Each entry appears at most once.
- Starting a session with a selected list passes only the list's resolved entries to
  `buildSessionItems`.

Out of scope: custom entries, reordering entries, any server code.

Acceptance criteria:

- Creating a list, adding `essere`, and refreshing keeps the list and its entry.
- `essere` appears only once in the editor, however often it is added.
- Starting that list produces only `essere` cards, and only for enabled tenses.
- "Hele dataset" behaves exactly as before.
- A list containing an unknown entry ID still renders and starts without errors.
- Corrupt `ripasso_lists_v1` data does not break the app.

Tests: unit tests for `lists.ts` and the local repository; one end-to-end test for the vertical
slice (create list, add `essere`, refresh, start, see only `essere`), run on desktop and mobile.

Docs: update this file's Status row, the README feature description, and anything in this step
that the implementation changed.

## Step 2 — Custom words (local)

**Goal:** users create their own words, which behave exactly like shared words.

In scope:

- `EntryRepository` with a local implementation over `ripasso_entries_v1`
  (`{ version: 1, entries: StudyEntry[] }`) that returns shared entries plus custom ones. Custom
  entries are stored alongside a local `origin: "custom"` marker kept only in the repository
  layer, never on `StudyEntry` itself. The repository's `listOwn()` returns the custom entries so
  the UI can show which entries are editable (the only method added to the interface).
- `src/lib/domain/entry-validation.ts`: pure validation returning Dutch error messages per field.
  - `it` and `nl` required after trimming.
  - `wordType` one of the keys of `WORDTYPE_NL` except `verb`.
  - For nouns: `gender` is `m` or `f` or empty, `number` is `singular` or `plural` or empty,
    `article` is one of `il`, `lo`, `la`, `l'`, `i`, `gli`, `le`, or empty.
  - A non-blocking warning if an entry with the same Italian text and word type already exists.
- A word form (create and edit) and a "Mijn woorden" view listing custom words with edit and
  delete. "Mijn woorden" is reachable from the lists view; the list editor has "Nieuw woord",
  which opens the form and adds the new word to the list being edited.
- Custom words appear in list editor search with a small "eigen" badge.

Acceptance criteria:

- A custom word survives a refresh, can be added to a list, and appears as a card in a session of
  that list and in "Hele dataset" sessions.
- Editing a custom word changes its cards; its progress is kept because its ID does not change.
- Deleting a custom word leaves lists that referenced it working.
- Shared entries cannot be edited or deleted.

Tests: validation unit tests, repository unit tests, one end-to-end test that creates a word,
adds it to a list, and practises it.

Docs: Status row, README.

## Step 3 — Custom verbs (local)

**Goal:** users create their own verbs.

In scope:

- Verb form: lemma, Dutch translation, auxiliary (`avere`, `essere`, or none), regularity (free
  text, suggested values `regolare` and `irregolare`), conjugation class (`-are`, `-ere`, `-ire`,
  or none), note, and the tense × person grid from the decisions log.
- Validation in `entry-validation.ts` for verbs, following the decisions log.
- Custom verbs appear in the "Mijn woorden en werkwoorden" view (still opened with the "Mijn
  woorden" button) and in list editor search. Both that view and the list editor have a "Nieuw
  werkwoord" action. The grid is one collapsible block per tense (Italian and Dutch column per
  person) that scrolls inside its own container when needed.

Acceptance criteria:

- A custom verb with forms only for `presente` produces only `presente` cards, and none when
  `presente` is disabled.
- Cells with only one of the two fields filled block saving with a clear message.
- The grid is usable at 390 px wide without horizontal page scroll (it may scroll inside its own
  container).

Tests: validation unit tests, one end-to-end test that creates a verb with one tense and
practises it.

Docs: Status row, README.

## Step 4 — D1 schema, migrations, and seed

**Goal:** a local D1 database with the full schema and base content, usable in development and
tests. No UI changes.

In scope:

- Add `drizzle-orm` and `drizzle-kit` as dependencies. `wrangler` is already installed as a peer
  dependency of the Cloudflare adapter; add it to `devDependencies` explicitly.
- `wrangler.jsonc` with a D1 binding named `DB`, `database_name: "ripasso"`, and
  `database_id: "00000000-0000-0000-0000-000000000000"` as a placeholder that humans replace at
  deploy time. Local development does not need a real ID.
- `App.Platform` typed in `src/app.d.ts` with `env.DB: D1Database`.
- Schema in `src/lib/server/db/schema.ts`:

  ```text
  entries      id text pk, type text ('word'|'verb'), owner_id text, visibility text
               ('private'|'public'), data text (JSON), search_text text, created_at int,
               updated_at int
  lists        id text pk, owner_id text, name text, visibility text ('private'|'unlisted'|
               'public'), share_slug text unique null, created_at int, updated_at int
  list_entries list_id text, entry_id text, position int, added_at int,
               pk (list_id, entry_id)
  progress     user_id text, card_id text, box int, seen int, correct int, wrong int,
               last int, pk (user_id, card_id)
  ```

  Owner and user IDs are plain text without foreign keys to an auth table, because auth arrives in
  step 6. Add indexes for `entries(owner_id)`, `lists(owner_id)`, and `list_entries(entry_id)`.
  `data` holds the `StudyEntry` fields other than `id` and `type`. `search_text` is a lowercased,
  accent-stripped concatenation of Italian, Dutch, and lemma for simple `LIKE` search.
- Migrations generated into `migrations/` and applied with
  `wrangler d1 migrations apply ripasso --local`.
- A seed script (`scripts/seed.ts`, run with Bun) that reads `static/data.json`, uses
  `entriesFromDeck`, and writes a SQL seed migration inserting all base entries (owner `system`,
  visibility `public`) and one base list "Basis" (ID `basis`, owner `system`, visibility
  `public`) containing every base entry. The seed is idempotent (`INSERT OR REPLACE`) and
  deterministic (fixed timestamps). Its file, `migrations/0001_seed.sql`, is registered in
  Drizzle's journal with `drizzle-kit generate --custom --name seed`, so later generated
  migrations number after it.
- `@cloudflare/workers-types` (for `D1Database`) and `@types/node` are dev dependencies;
  `wrangler.jsonc` enables `nodejs_compat`.
- `package.json` scripts: `db:generate`, `db:migrate:local`, `db:seed`.
- Mapping functions `entryToRow` / `rowToEntry` in `src/lib/server/db/`, with round-trip tests
  proving every base entry survives unchanged.

Acceptance criteria:

- From a clean checkout, `bun run db:migrate:local` creates a local database containing all base
  entries and the base list.
- Round-trip tests pass for every entry in `static/data.json`.
- Existing app behaviour is unchanged; no production code reads from D1 yet.

Tests: mapping unit tests. Repository integration tests begin in step 5.

Docs: Status row, README "Development" section (database commands), a new "Deployment" section in
the README listing the human-only steps (see "Human-only tasks" below).

## Step 5 — Server repositories and entries API

**Goal:** the app reads base content from the server instead of `static/data.json`.

In scope:

- Server repositories in `src/lib/server/repositories/` taking a `D1Database` and an optional
  current user ID: `entries.listVisible(userId?)` returns public entries plus the user's own.
- Integration tests for server repositories against a local D1 created through wrangler's
  `getPlatformProxy()` with migrations applied to a temporary persistence directory
  (`createTestDatabase()` in `src/lib/server/testing/d1.ts`, which runs each migration's
  statements in a batch). Documented in `AGENTS.md`.
- `GET /api/entries` returning `StudyEntry[]` visible to the caller (no auth yet, so public
  entries).
- `+page.ts` loads entries from `/api/entries`. Guest custom entries from step 2 are still merged
  in on the client by the local `EntryRepository`.
- Playwright's `webServer` command runs local migrations before starting the dev server, so a
  fresh checkout's end-to-end run works.
- The dev server exposes the D1 binding through the Cloudflare adapter's platform proxy.

Acceptance criteria:

- The app works as before with data served from D1.
- `static/data.json` is no longer fetched by the app (it remains as the seed source).
- All existing end-to-end tests pass unchanged.

Docs: Status row, README, `AGENTS.md` if test setup changed.

## Step 6 — Accounts

**Goal:** users can register, log in, and log out. Logged-in users' lists and custom entries are
stored on the server.

In scope:

- Better Auth configured with the D1 database, email and password, and its own tables added by a
  migration. The migration also inserts the `system` user row so ownership is consistent.
- `src/hooks.server.ts` sets `event.locals.user` (typed in `app.d.ts`).
- Pages `/inloggen` and `/account-aanmaken`, and a "Uitloggen" action in the header. Minimum
  password length 8. Dutch error messages.
- `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` read from the platform env. Local development uses
  `.dev.vars` (gitignored); commit `.dev.vars.example` with a clearly fake value. Test setup
  creates `.dev.vars` from the example when it is missing.
- Authenticated endpoints, all checking ownership on the server:
  - `GET/POST /api/lists`, `PUT/DELETE /api/lists/[id]`
  - `POST /api/entries`, `PUT/DELETE /api/entries/[id]` (own entries only)
- `GET /api/entries?scope=own` returns only the caller's own entries (backs
  `EntryRepository.listOwn()`).
- Remote `ListRepository` and `EntryRepository` implementations (`src/lib/repositories/remote.ts`)
  used when a user is logged in; the local ones stay in use for guests.
- The base list is visible to logged-in users in the list selector but cannot be edited: lists
  the user does not own are returned with `readOnly: true` (an optional `PracticeList` field) and
  the lists view shows them with a "vast" badge and no edit or delete actions.
- Registration asks only for e-mail and password; Better Auth's required `name` is the part of
  the e-mail address before `@`. The forms are validated on the server so every message is Dutch.

Acceptance criteria:

- Register, log out, log in again: lists and custom entries created while logged in are there.
- A user cannot read, change, or delete another user's private list or entry. Integration tests
  prove this for every endpoint above (expect 404 for unreadable resources, not 403).
- Guests keep working exactly as in steps 1–3.

Out of scope: progress on the server (step 7), email verification, password reset, OAuth,
rate limiting beyond Better Auth's defaults.

Docs: Status row, README (auth and local secrets), `AGENTS.md` (how tests create users).

## Step 7 — Guest-to-account sync

**Goal:** progress lives on the server for logged-in users, and guest data moves over on first
login.

In scope:

- `ProgressRepository` with local (existing `srs.ts` storage) and remote implementations.
- `GET /api/progress`, `PUT /api/progress/[cardId]`, `DELETE /api/progress`.
- On login, if `ripasso_sync_v1` has no record for this user ID, import local custom entries
  (keeping their IDs), local lists, and local progress (merge rule from the decisions log), then
  write `{ version: 1, imported: { [userId]: timestamp } }`. Import is one batched request
  (`POST /api/import`) and is idempotent: entries and lists are created only when their ID is
  free (an ID owned by someone else is skipped), invalid items are skipped, and progress rows
  only replace server rows with a smaller `last`. Nothing is sent when the browser has no guest
  data; a failed import is not recorded, so it is retried on the next page load.
  (`src/lib/repositories/guest-import.ts`, `src/lib/server/repositories/import.ts`.)
- Multi-row inserts are chunked to stay within D1's 100 bound parameters per query
  (`src/lib/server/db/chunk.ts`).
- "Voortgang wissen" clears the server progress for logged-in users.
- Progress writes after grading are optimistic; a failed write shows the existing storage
  warning.

Acceptance criteria:

- A guest with progress, a list, and a custom word registers and sees all three.
- Logging in on the same browser again does not import twice.
- Importing progress where the server already has a newer row keeps the newer row.

Docs: Status row, README.

## Step 8 — Sharing lists

**Goal:** a list owner can share a list by link.

In scope:

- "Deel lijst" in the lists view for own lists: sets visibility `unlisted`, generates a
  `share_slug` of at least 16 URL-safe random characters, and shows the URL with a copy button.
  "Stop met delen" sets it back to `private` and clears the slug.
- Route `/l/[slug]`: shows the list name and counts, "Oefen deze lijst" (live practice using the
  menu settings), and for logged-in non-owners "Kopieer naar mijn lijsten".
- Entries referenced by an unlisted list are readable through that list's endpoint
  (`GET /api/shared/[slug]`) even when they are the owner's private entries. They are not
  readable any other way.
- Copy follows the decisions log.
- Endpoints added for this: `POST /api/lists/[id]/share` (returns `{ shareSlug }`; sharing an
  already shared list keeps its slug), `DELETE /api/lists/[id]/share`, and
  `POST /api/shared/[slug]/copy`. `GET /api/shared/[slug]` returns
  `{ list, entries, isOwner }`. Slugs are 24 URL-safe characters (144 random bits).
- Sharing needs an account (only server lists have a link); the lists view shows "Deel lijst"
  only to logged-in users. Own lists carry an optional `shareSlug` on `PracticeList`.
- "Oefen deze lijst" opens the main page with `?gedeeld=<slug>`, which adds the list to the
  "Oefenen uit" select as "Gedeeld: <name>" and selects it, so the usual menu settings apply.
  The shared list is not stored; progress is stored as usual (locally for guests).

Acceptance criteria:

- A guest opening a share link can practise it and their progress is saved locally.
- After "Stop met delen" the link returns 404.
- A copied list keeps working after the original owner deletes or unshares theirs.

Docs: Status row, README.

## Step 9 — Cleanup and final docs pass

In scope:

- Move `static/data.json` to `seed/data.json` if nothing at runtime needs it any more, and update
  the seed script.
- Remove code made dead by steps 1–8.
- Make sure the README describes the finished app, local development, tests, and deployment, and
  that this roadmap's Status table and decisions log match reality.
- Leave the legacy root `index.html` and `data.js` in place; deleting them is a human decision.

## Human-only tasks

These are never done by an agent. The README's Deployment section lists them once step 4 lands.

1. `wrangler d1 create ripasso` and put the real `database_id` in `wrangler.jsonc`.
2. `wrangler d1 migrations apply ripasso --remote`.
3. Set `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` for the deployed app, and enable the
   `nodejs_compat` compatibility flag (required by Better Auth; Cloudflare Pages preview
   deployments fail without it from step 6 on).
4. Deploy to Cloudflare.
5. Merge the stack bottom-up.
