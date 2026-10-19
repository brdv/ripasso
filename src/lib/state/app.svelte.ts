import { getContext, setContext } from "svelte";
import { cardCounts, expandEntriesToCards } from "$lib/domain/cards";
import { TENSES } from "$lib/domain/constants";
import { addEntry, createList, listEntries, removeEntry, renameList } from "$lib/domain/lists";
import { buildSessionItems, createSession, defaultMenuState } from "$lib/domain/session";
import { record } from "$lib/domain/srs";
import type { EntryId, PracticeList, Progress, StudyEntry, StudySession } from "$lib/domain/types";
import { importGuestDataOnce } from "$lib/repositories/guest-import";
import { LocalEntryRepository } from "$lib/repositories/local-entries";
import { LocalListRepository } from "$lib/repositories/local-lists";
import { LocalProgressRepository } from "$lib/repositories/local-progress";
import {
  RemoteEntryRepository,
  RemoteListRepository,
  RemoteProgressRepository,
} from "$lib/repositories/remote";
import type { EntryRepository, ListRepository, ProgressRepository } from "$lib/repositories/types";

export type SessionView = "session" | "paper-review" | "summary";

/**
 * App-wide state for the practice pages: entries, lists, progress, and the running session.
 * Created once by the `(app)` layout and shared with its pages through context.
 */
export class AppState {
  readonly user: { id: string; email: string } | null;
  /** The entries loaded from `/api/entries`. */
  private readonly baseEntries = $state.raw<StudyEntry[]>([]);

  ownEntries = $state<StudyEntry[]>([]);
  entriesStorageOk = $state(true);
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- rebuilt by $derived, never mutated.
  readonly ownIds = $derived(new Set(this.ownEntries.map((entry) => entry.id)));
  // For logged-in users the loaded entries already contain their own; keep those only once.
  readonly entries = $derived([
    ...this.baseEntries.filter((entry) => !this.ownIds.has(entry.id)),
    ...this.ownEntries,
  ]);
  readonly dataSummary = $derived.by(() => {
    const counts = cardCounts(expandEntriesToCards(this.entries, TENSES));
    return `${counts.verbCards} werkwoordskaarten (${counts.verbCount} werkwoorden) + ${counts.wordCards} woorden`;
  });

  menu = $state(defaultMenuState());
  progress = $state<Progress>({});
  storageOk = $state(true);
  session = $state<StudySession | null>(null);
  sessionView = $state<SessionView>("session");
  menuWarning = $state("");
  ready = $state(false);

  lists = $state<PracticeList[]>([]);
  listsStorageOk = $state(true);
  selectedListId = $state("");
  // A list opened through a share link ("Oefen deze lijst"); practised live, never stored.
  sharedSource = $state<{ list: PracticeList; entries: StudyEntry[] } | null>(null);
  readonly menuLists = $derived(this.sharedSource ? [this.sharedSource.list, ...this.lists] : this.lists);

  private listRepository: ListRepository | undefined;
  private remoteListRepository: RemoteListRepository | undefined;
  private entryRepository: EntryRepository | undefined;
  private progressRepository: ProgressRepository | undefined;

  constructor(baseEntries: StudyEntry[], user: { id: string; email: string } | null) {
    this.baseEntries = baseEntries;
    this.user = user;
  }

  get storageWarning(): string {
    return this.user
      ? "Let op: opslaan op de server lukte niet. Probeer het later opnieuw."
      : "Let op: opslag werkt niet in deze browser. Je kunt wel blijven oefenen, maar wijzigingen blijven niet bewaard.";
  }

  /** Loads lists, own entries, and progress from the server or from local storage. */
  load(storage: Storage) {
    if (this.user) {
      // Logged-in users read and write through the server. On the first login in this browser
      // the guest data is copied into the account once; the guest data itself stays untouched.
      const remoteLists = new RemoteListRepository();
      const remoteEntries = new RemoteEntryRepository();
      const remoteProgress = new RemoteProgressRepository();
      this.listRepository = remoteLists;
      this.remoteListRepository = remoteLists;
      this.entryRepository = remoteEntries;
      this.progressRepository = remoteProgress;
      importGuestDataOnce(storage, this.user.id)
        .catch(() => this.failAll())
        .then(() => Promise.all([remoteLists.list(), remoteEntries.listOwn(), remoteProgress.load()]))
        .then(([storedLists, storedEntries, storedProgress]) => {
          this.lists = storedLists;
          this.ownEntries = storedEntries;
          this.progress = storedProgress;
        })
        .catch(() => this.failAll())
        .finally(() => (this.ready = true));
    } else {
      const localProgress = new LocalProgressRepository(storage);
      const localLists = new LocalListRepository(storage);
      const localEntries = new LocalEntryRepository(this.baseEntries, storage);
      this.progressRepository = localProgress;
      this.listRepository = localLists;
      this.entryRepository = localEntries;
      Promise.all([localProgress.load(), localLists.list(), localEntries.listOwn()]).then(
        ([loadedProgress, storedLists, storedEntries]) => {
          this.progress = loadedProgress;
          this.storageOk = localProgress.ok;
          this.lists = storedLists;
          this.listsStorageOk = localLists.ok;
          this.ownEntries = storedEntries;
          this.entriesStorageOk = localEntries.ok;
          this.ready = true;
        },
      );
    }
  }

  private failAll() {
    this.listsStorageOk = this.entriesStorageOk = this.storageOk = false;
  }

  async loadSharedSource(slug: string) {
    try {
      const response = await fetch(`/api/shared/${encodeURIComponent(slug)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const shared = (await response.json()) as { list: PracticeList; entries: StudyEntry[] };
      this.sharedSource = {
        list: { ...shared.list, id: `gedeeld:${slug}`, name: `Gedeeld: ${shared.list.name}`, readOnly: true },
        entries: shared.entries,
      };
      this.selectedListId = this.sharedSource.list.id;
    } catch {
      this.menuWarning = "Deze gedeelde lijst kon niet worden geladen.";
    }
  }

  /** Starts a session from the menu settings. Returns false and sets the menu warning when empty. */
  startSession(): boolean {
    const selectedList = this.menuLists.find((list) => list.id === this.selectedListId);
    const pool = this.sharedSource ? [...this.entries, ...this.sharedSource.entries] : this.entries;
    const sessionEntries = selectedList ? listEntries(selectedList, pool) : this.entries;
    const items = buildSessionItems(sessionEntries, this.menu, this.progress);

    if (items.length === 0) {
      this.menuWarning = "Geen kaarten met deze keuzes. Zet minstens één tijd aan, of vink woorden aan.";
      return false;
    }

    this.menuWarning = "";
    this.session = createSession(this.menu, items);
    this.sessionView = "session";
    return true;
  }

  reveal() {
    if (!this.session || this.sessionView !== "session" || this.session.phase !== "prompt") return;
    this.session.phase = "revealed";
  }

  grade(correct: boolean) {
    const session = this.session;
    if (!session || this.sessionView !== "session" || session.phase !== "revealed") return;

    const item = session.items[session.idx];
    session.phase = "grading";
    if (correct) session.correct += 1;

    this.progress = record(this.progress, item.card.id, correct);
    this.persistProgress([item.card.id]);

    session.idx += 1;
    if (session.idx >= session.items.length) {
      this.sessionView = "summary";
    } else {
      session.phase = "prompt";
    }
  }

  advancePaper() {
    const session = this.session;
    if (!session || this.sessionView !== "session" || session.phase !== "paper-prompt") return;

    session.idx += 1;
    if (session.idx >= session.items.length) this.sessionView = "paper-review";
  }

  processPaper(results: boolean[]) {
    const session = this.session;
    if (!session || this.sessionView !== "paper-review" || results.length !== session.items.length) return;

    let nextProgress = this.progress;
    session.correct = 0;

    results.forEach((correct, index) => {
      if (correct) session.correct += 1;
      nextProgress = record(nextProgress, session.items[index].card.id, correct);
    });

    this.progress = nextProgress;
    this.persistProgress(session.items.map((sessionItem) => sessionItem.card.id));
    this.sessionView = "summary";
  }

  /** Optimistic: the UI already shows the new progress; a failed write shows the warning. */
  private persistProgress(cardIds: string[]) {
    const repository = this.progressRepository;
    if (!repository) return;
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a local, non-reactive dedupe.
    const writes = [...new Set(cardIds)].map((cardId) => repository.record(cardId, this.progress[cardId]));
    Promise.all(writes).then(
      () => (this.storageOk = true),
      () => (this.storageOk = false),
    );
  }

  resetProgress() {
    this.progress = {};
    this.progressRepository?.clear().then(
      () => (this.storageOk = true),
      () => (this.storageOk = false),
    );
  }

  private persistList(list: PracticeList) {
    this.lists = this.lists.some((existing) => existing.id === list.id)
      ? this.lists.map((existing) => (existing.id === list.id ? list : existing))
      : [...this.lists, list];
    this.listRepository?.save(list).then(
      () => (this.listsStorageOk = true),
      () => (this.listsStorageOk = false),
    );
  }

  /** Creates a list and returns it, or returns the validation message. */
  createList(name: string): PracticeList | string {
    let list: PracticeList;
    try {
      list = createList(name);
    } catch (error) {
      return (error as Error).message;
    }
    this.persistList(list);
    return list;
  }

  renameList(id: string, name: string): string | void {
    const list = this.lists.find((existing) => existing.id === id);
    if (!list) return;
    try {
      this.persistList(renameList(list, name));
    } catch (error) {
      return (error as Error).message;
    }
  }

  toggleListEntry(id: string, entryId: EntryId, include: boolean) {
    const list = this.lists.find((existing) => existing.id === id);
    if (!list) return;
    this.persistList(include ? addEntry(list, entryId) : removeEntry(list, entryId));
  }

  async shareList(id: string, share: boolean) {
    const repository = this.remoteListRepository;
    if (!repository) return;
    try {
      const shareSlug = share ? await repository.share(id) : undefined;
      if (!share) await repository.unshare(id);
      this.lists = this.lists.map((list) => (list.id === id ? { ...list, shareSlug } : list));
      this.listsStorageOk = true;
    } catch {
      this.listsStorageOk = false;
    }
  }

  deleteList(id: string) {
    this.lists = this.lists.filter((list) => list.id !== id);
    if (this.selectedListId === id) this.selectedListId = "";
    this.listRepository?.remove(id).then(
      () => (this.listsStorageOk = true),
      () => (this.listsStorageOk = false),
    );
  }

  /** Saves an own entry; a new one is also added to `listId` when given. */
  saveEntry(entry: StudyEntry, listId?: string) {
    const isNew = !this.ownIds.has(entry.id);
    this.ownEntries = isNew
      ? [...this.ownEntries, entry]
      : this.ownEntries.map((existing) => (existing.id === entry.id ? entry : existing));
    this.entryRepository?.save(entry).then(
      () => (this.entriesStorageOk = true),
      () => (this.entriesStorageOk = false),
    );
    if (isNew && listId) this.toggleListEntry(listId, entry.id, true);
  }

  deleteEntry(id: EntryId) {
    this.ownEntries = this.ownEntries.filter((entry) => entry.id !== id);
    this.entryRepository?.remove(id).then(
      () => (this.entriesStorageOk = true),
      () => (this.entriesStorageOk = false),
    );
  }
}

const KEY = Symbol("app-state");

export function setAppState(state: AppState): AppState {
  return setContext(KEY, state);
}

export function getAppState(): AppState {
  return getContext<AppState>(KEY);
}
