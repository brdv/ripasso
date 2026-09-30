<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import AppHeader from "$lib/components/AppHeader.svelte";
  import { cardCounts, expandEntriesToCards } from "$lib/domain/cards";
  import { entriesFromDeck } from "$lib/domain/entries";
  import { addEntry, createList, listEntries, removeEntry, renameList } from "$lib/domain/lists";
  import { TENSES } from "$lib/domain/constants";
  import { buildSessionItems, createSession, defaultMenuState } from "$lib/domain/session";
  import { clearSrs, loadSrs, record, saveSrs } from "$lib/domain/srs";
  import type {
    EntryId,
    PracticeList,
    Progress,
    StudyEntry,
    StudySession,
  } from "$lib/domain/types";
  import { LocalEntryRepository } from "$lib/repositories/local-entries";
  import { LocalListRepository } from "$lib/repositories/local-lists";
  import type { EntryRepository, ListRepository } from "$lib/repositories/types";
  import ListEditorView from "$lib/views/ListEditorView.svelte";
  import ListsView from "$lib/views/ListsView.svelte";
  import MenuView from "$lib/views/MenuView.svelte";
  import MyEntriesView from "$lib/views/MyEntriesView.svelte";
  import VerbFormView from "$lib/views/VerbFormView.svelte";
  import WordFormView from "$lib/views/WordFormView.svelte";
  import PaperReviewView from "$lib/views/PaperReviewView.svelte";
  import StudyView from "$lib/views/StudyView.svelte";
  import SummaryView from "$lib/views/SummaryView.svelte";
  import type { PageProps } from "./$types";

  type AppView =
    | "menu"
    | "session"
    | "paper-review"
    | "summary"
    | "lists"
    | "list-editor"
    | "my-entries"
    | "entry-form";

  let { data }: PageProps = $props();

  const sharedEntries = $derived(entriesFromDeck(data.deck));
  let ownEntries = $state<StudyEntry[]>([]);
  let entriesStorageOk = $state(true);
  const entries = $derived([...sharedEntries, ...ownEntries]);
  const ownIds = $derived(new Set(ownEntries.map((entry) => entry.id)));
  const cards = $derived(expandEntriesToCards(entries, TENSES));
  const counts = $derived(cardCounts(cards));
  const dataSummary = $derived(
    `${counts.verbCards} werkwoordskaarten (${counts.verbCount} werkwoorden × 5 tijden) + ${counts.wordCards} woorden`,
  );

  let menu = $state(defaultMenuState());
  let progress = $state<Progress>({});
  let storageOk = $state(true);
  let view = $state<AppView>("menu");
  let session = $state<StudySession | null>(null);
  let menuWarning = $state("");
  let resetNote = $state("");
  let ready = $state(false);
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  let listRepository: ListRepository | undefined;
  let lists = $state<PracticeList[]>([]);
  let listsStorageOk = $state(true);
  let selectedListId = $state("");
  let editingListId = $state<string | null>(null);
  const editingList = $derived(lists.find((list) => list.id === editingListId) ?? null);

  let entryRepository: EntryRepository | undefined;
  let entryForm = $state<{
    kind: StudyEntry["type"];
    entryId: EntryId | null;
    returnTo: AppView;
    key: number;
  } | null>(null);
  const entryFormEntry = $derived(ownEntries.find((entry) => entry.id === entryForm?.entryId));

  onMount(() => {
    const loaded = loadSrs(window.localStorage);
    progress = loaded.progress;
    storageOk = loaded.ok;

    const localLists = new LocalListRepository(window.localStorage);
    const localEntries = new LocalEntryRepository(sharedEntries, window.localStorage);
    listRepository = localLists;
    entryRepository = localEntries;
    Promise.all([localLists.list(), localEntries.listOwn()]).then(([storedLists, storedEntries]) => {
      lists = storedLists;
      listsStorageOk = localLists.ok;
      ownEntries = storedEntries;
      entriesStorageOk = localEntries.ok;
      ready = true;
    });

    return () => clearTimeout(resetTimer);
  });

  function scrollTop() {
    if (browser) window.scrollTo({ top: 0, behavior: "instant" });
  }

  function startSession() {
    const selectedList = lists.find((list) => list.id === selectedListId);
    const sessionEntries = selectedList ? listEntries(selectedList, entries) : entries;
    const items = buildSessionItems(sessionEntries, menu, progress);

    if (items.length === 0) {
      menuWarning =
        "Geen kaarten met deze keuzes. Zet minstens één tijd aan, of vink woorden aan.";
      return;
    }

    menuWarning = "";
    session = createSession(menu, items);
    view = "session";
    scrollTop();
  }

  function goToMenu() {
    view = "menu";
    scrollTop();
  }

  function openLists() {
    view = "lists";
    scrollTop();
  }

  function persistList(list: PracticeList) {
    lists = lists.some((existing) => existing.id === list.id)
      ? lists.map((existing) => (existing.id === list.id ? list : existing))
      : [...lists, list];
    listRepository?.save(list).then(
      () => (listsStorageOk = true),
      () => (listsStorageOk = false),
    );
  }

  function handleCreateList(name: string): string | void {
    let list: PracticeList;
    try {
      list = createList(name);
    } catch (error) {
      return (error as Error).message;
    }
    persistList(list);
    editList(list.id);
  }

  function editList(id: string) {
    editingListId = id;
    view = "list-editor";
    scrollTop();
  }

  function handleRenameList(name: string): string | void {
    if (!editingList) return;
    try {
      persistList(renameList(editingList, name));
    } catch (error) {
      return (error as Error).message;
    }
  }

  function handleToggleEntry(entryId: EntryId, include: boolean) {
    if (!editingList) return;
    persistList(include ? addEntry(editingList, entryId) : removeEntry(editingList, entryId));
  }

  function handleDeleteList(id: string) {
    lists = lists.filter((list) => list.id !== id);
    if (selectedListId === id) selectedListId = "";
    listRepository?.remove(id).then(
      () => (listsStorageOk = true),
      () => (listsStorageOk = false),
    );
  }

  function openMyEntries() {
    view = "my-entries";
    scrollTop();
  }

  function openEntryForm(kind: StudyEntry["type"], entryId: EntryId | null, returnTo: AppView) {
    entryForm = { kind, entryId, returnTo, key: (entryForm?.key ?? 0) + 1 };
    view = "entry-form";
    scrollTop();
  }

  function editOwnEntry(id: EntryId) {
    const entry = ownEntries.find((own) => own.id === id);
    if (entry) openEntryForm(entry.type, id, "my-entries");
  }

  function closeEntryForm() {
    view = entryForm?.returnTo ?? "my-entries";
    entryForm = null;
    scrollTop();
  }

  function handleSaveEntry(entry: StudyEntry) {
    const isNew = !ownIds.has(entry.id);
    ownEntries = isNew
      ? [...ownEntries, entry]
      : ownEntries.map((existing) => (existing.id === entry.id ? entry : existing));
    entryRepository?.save(entry).then(
      () => (entriesStorageOk = true),
      () => (entriesStorageOk = false),
    );
    if (isNew && entryForm?.returnTo === "list-editor" && editingList) {
      persistList(addEntry(editingList, entry.id));
    }
    closeEntryForm();
  }

  function handleDeleteEntry(id: EntryId) {
    ownEntries = ownEntries.filter((entry) => entry.id !== id);
    entryRepository?.remove(id).then(
      () => (entriesStorageOk = true),
      () => (entriesStorageOk = false),
    );
  }

  function reveal() {
    if (!session || view !== "session" || session.phase !== "prompt") return;
    session.phase = "revealed";
  }

  function grade(correct: boolean) {
    if (!session || view !== "session" || session.phase !== "revealed") return;

    const item = session.items[session.idx];
    session.phase = "grading";
    if (correct) session.correct += 1;

    progress = record(progress, item.card.id, correct);
    storageOk = saveSrs(progress, window.localStorage);
    advanceDirect();
  }

  function advanceDirect() {
    if (!session) return;

    session.idx += 1;
    if (session.idx >= session.items.length) {
      view = "summary";
    } else {
      session.phase = "prompt";
    }
    scrollTop();
  }

  function advancePaper() {
    if (!session || view !== "session" || session.phase !== "paper-prompt") return;

    session.idx += 1;
    if (session.idx >= session.items.length) view = "paper-review";
    scrollTop();
  }

  function processPaper(results: boolean[]) {
    if (!session || view !== "paper-review" || results.length !== session.items.length) return;

    let nextProgress = progress;
    session.correct = 0;

    results.forEach((correct, index) => {
      if (correct) session!.correct += 1;
      nextProgress = record(nextProgress, session!.items[index].card.id, correct);
    });

    progress = nextProgress;
    storageOk = saveSrs(progress, window.localStorage);
    view = "summary";
    scrollTop();
  }

  function resetProgress() {
    if (!window.confirm("Alle voortgang in deze browser wissen?")) return;

    progress = {};
    storageOk = clearSrs(window.localStorage);
    resetNote = "Voortgang gewist.";
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => (resetNote = ""), 2000);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!session || view !== "session" || event.repeat) return;

    if (
      session.phase === "prompt" &&
      (event.key === "Enter" || event.key === " " || event.key === "ArrowDown")
    ) {
      event.preventDefault();
      reveal();
      return;
    }

    if (session.phase === "revealed") {
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "g") {
        event.preventDefault();
        grade(true);
      } else if (event.key === "ArrowLeft" || event.key.toLowerCase() === "f") {
        event.preventDefault();
        grade(false);
      }
      return;
    }

    if (
      session.phase === "paper-prompt" &&
      (event.key === "Enter" || event.key === " " || event.key === "ArrowRight")
    ) {
      event.preventDefault();
      advancePaper();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="wrap" data-ready={ready}>
  <AppHeader summary={dataSummary} />

  {#if view === "menu"}
    <MenuView
      bind:menu
      bind:selectedListId
      {lists}
      warning={menuWarning}
      {resetNote}
      onStart={startSession}
      onReset={resetProgress}
      onManageLists={openLists}
    />
  {:else if view === "lists"}
    <ListsView
      {lists}
      {entries}
      storageOk={listsStorageOk}
      onBack={goToMenu}
      onCreate={handleCreateList}
      onEdit={editList}
      onDelete={handleDeleteList}
      onMyEntries={openMyEntries}
    />
  {:else if view === "my-entries"}
    <MyEntriesView
      entries={ownEntries}
      storageOk={entriesStorageOk}
      onBack={openLists}
      onCreateWord={() => openEntryForm("word", null, "my-entries")}
      onCreateVerb={() => openEntryForm("verb", null, "my-entries")}
      onEdit={editOwnEntry}
      onDelete={handleDeleteEntry}
    />
  {:else if view === "entry-form" && entryForm}
    {#key entryForm.key}
      {#if entryForm.kind === "verb"}
        <VerbFormView
          entry={entryFormEntry?.type === "verb" ? entryFormEntry : undefined}
          {entries}
          onSave={handleSaveEntry}
          onCancel={closeEntryForm}
        />
      {:else}
        <WordFormView
          entry={entryFormEntry?.type === "word" ? entryFormEntry : undefined}
          {entries}
          onSave={handleSaveEntry}
          onCancel={closeEntryForm}
        />
      {/if}
    {/key}
  {:else if view === "list-editor" && editingList}
    {#key editingList.id}
      <ListEditorView
        list={editingList}
        {entries}
        {ownIds}
        onBack={openLists}
        onCreateWord={() => openEntryForm("word", null, "list-editor")}
        onCreateVerb={() => openEntryForm("verb", null, "list-editor")}
        onRename={handleRenameList}
        onToggle={handleToggleEntry}
      />
    {/key}
  {:else if view === "session" && session}
    <StudyView
      {session}
      onBack={goToMenu}
      onReveal={reveal}
      onGrade={grade}
      onPaperNext={advancePaper}
    />
  {:else if view === "paper-review" && session}
    <PaperReviewView {session} onBack={goToMenu} onProcess={processPaper} />
  {:else if view === "summary" && session}
    <SummaryView {session} {progress} {storageOk} onAgain={goToMenu} />
  {/if}
</div>
