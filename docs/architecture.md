# Ripasso architecture and design decisions

The principles and decisions behind the app. Read `AGENTS.md` first for conventions, verification
commands, and git rules. When a change makes anything here untrue, update this file in the same
PR.

## Product direction

Users can create named practice lists, fill them with shared words and verbs and with their own
entries, practise only a selected list, and share lists with others. A list contains **source
entries**, not flashcards: adding the verb `essere` adds one entry, which a session expands into
cards for the enabled tenses and persons.

## Architecture principles

These hold for every change.

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
     listOwn(): Promise<StudyEntry[]>; // the current user's own, editable entries
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

   Keep them this small; add methods only when a feature needs one.
6. **Local-first guests.** A guest (not logged in) uses the app entirely from local storage,
   forever. Accounts add server persistence; they never become a requirement for practising.
7. **Versioned local storage.** Each local-storage key holds `{ "version": 1, ... }` and is read
   defensively: invalid or unparsable data is treated as empty and the UI shows the existing
   storage warning pattern instead of crashing.

## Decisions log

Items marked **revisit** are deliberate placeholders a human may change later; until then, follow
them as written.

| Area | Decision |
| ---- | -------- |
| List selector | A "Oefenen uit" select at the top of the menu: "Hele dataset" plus one option per list. Not persisted; defaults to "Hele dataset". **revisit** |
| Navigation | Every screen is a SvelteKit route in the `(app)` group: `/` (session settings), `/sessie`, `/lijsten`, `/lijsten/[id]`, `/woorden`, `/woorden/nieuw?soort=woord\|werkwoord[&lijst=<id>]`, `/woorden/[id]`, `/woorden/[id]/bewerken[?lijst=<id>]`. Entry IDs in URLs are `encodeURIComponent`-encoded. A top navbar links Oefenen, Lijsten, and Woorden. Shared state lives in one `AppState` created by the `(app)` layout; entering the group again (after login or logout) creates a fresh one. |
| List editor | One search and filter set (`EntryFilters`, `filterEntries`) applies to all entries shown. From 900 px wide (`MediaQuery`) two columns: available entries (alphabetical) and the list's entries (in list order). Narrower: one alphabetical list with an in-place add/remove toggle per row and an "In deze lijst (n)" chip. Rows link to the entry page with `?lijst=<id>`, so its "Terug" and "Bewerken" return to the editor. |
| Words page | `/woorden` lists all entries the user can practise (built-in and own), sorted by Italian headword, filtered by `filterEntries` (search, kind, "Alleen eigen"). The filter lives in `AppState` so it survives visiting an entry. Every entry has a read-only detail page; only own entries get Bewerken and Verwijderen. |
| Practice sessions | A session lives in memory in `AppState` and is shown at `/sessie`, which hides the navbar and has a "Stoppen" button. Reloading `/sessie` or opening it without a session goes back to `/`. |
| Menu filters on lists | Werkwoorden/Woorden checkboxes and tense toggles still apply to list sessions. An empty result shows the existing menu warning. |
| Empty lists | Allowed. Starting one shows the menu warning. |
| Local storage keys | `ripasso_lists_v1`, `ripasso_entries_v1`, `ripasso_sync_v1`. Progress stays in `ripasso_progress_v2`. |
| New IDs | Lists: `crypto.randomUUID()`. Custom entries: `word:<uuid>` / `verb:<uuid>`. Base entries keep their existing IDs (`word:<it>`, `verb:<lemma>`). |
| Tense theory | Each tense block in the verb editor has a "Hoe vorm je deze tijd?" link that opens a native modal `<dialog>` (Esc, backdrop click, or "Sluiten" close it). The dialog follows the owner's design: a tagline, a "stam + uitgang" table of model verbs with highlighted endings (-isc- and spelling changes in a second colour, a row the notes refer to highlighted), notes, an irregular section (a verb × person grid, or a list of participles or future stems), and signal words. Theory text uses a small markup (`parseRich` in `src/lib/domain/rich-text.ts`). The model table fits without scrolling sideways, also at phone width (checked in e2e); on a phone only the irregular grid scrolls inside its card, with a sticky verb column. The passato prossimo table shows one avere- and one essere-verb, with agreement shortened to -o/a. The Dutch text lives in `src/lib/domain/tense-theory.ts`; every Italian form it shows (model-verb tables, irregular forms and stems) is generated by `conjugate` in `src/lib/domain/conjugation.ts`. The rules cover -are/-ere/-ire (with -isc-) and their spelling changes; `IRREGULAR_VERBS` names where each built-in verb leaves them (per-person forms, participle, imperfetto stem, futuro/condizionale stem). Tests require every seed form to be explained by the rules or that list, and the model verbs to match Wiktionary (`conjugation.fixtures.json`). Shown only in the verb editor for now. **revisit** |
| Custom verb editor | A tense × person grid; each cell has an Italian and a Dutch field. Every cell is optional; a cell must have both or neither; at least one complete cell is required. The Dutch field shows the person's pronoun (`PERSON_NL`: ik, jij, hij/zij, wij, jullie, zij) as a fixed prefix and the user types only the verb part. Stored Dutch forms keep the pronoun in front, as in the base content; a pronoun the user types anyway (including "je", "we", "ze") is not doubled. **revisit** |
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

