<script lang="ts">
  import EntryRow from "$lib/components/EntryRow.svelte";
  import { formatListCounts, hasEntry, listCounts, listEntries } from "$lib/domain/lists";
  import { matchesSearch } from "$lib/domain/search";
  import type { EntryId, PracticeList, StudyEntry } from "$lib/domain/types";
  import { untrack } from "svelte";

  let {
    list,
    entries,
    onBack,
    onRename,
    onToggle,
  }: {
    list: PracticeList;
    entries: StudyEntry[];
    onBack: () => void;
    onRename: (name: string) => string | void;
    onToggle: (entryId: EntryId, include: boolean) => void;
  } = $props();

  // Seeded once from the list; the editor owns the draft name while it is open.
  let name = $state(untrack(() => list.name));
  let nameError = $state("");
  let query = $state("");

  const current = $derived(listEntries(list, entries));
  const available = $derived(
    entries.filter((entry) => !hasEntry(list, entry.id) && matchesSearch(entry, query)),
  );

  function rename() {
    const result = onRename(name);
    nameError = typeof result === "string" ? result : "";
  }
</script>

<main>
  <div class="topbar">
    <button class="btn btn-ghost compact-button" type="button" onclick={onBack}>Lijsten</button>
    <h1 class="view-title">Lijst bewerken</h1>
  </div>

  <div class="card-pane">
    <div class="field">
      <label class="label" for="list-name">Naam</label>
      <input
        id="list-name"
        class="text-input"
        type="text"
        autocomplete="off"
        bind:value={name}
        onchange={rename}
      />
      <div class="menu-warning" role="status">{nameError}</div>
    </div>

    <div class="field">
      <div class="label">In deze lijst · {formatListCounts(listCounts(list, entries))}</div>
      {#if current.length === 0}
        <p class="pl-intro">Nog leeg. Zoek hieronder om woorden en werkwoorden toe te voegen.</p>
      {:else}
        <ul class="list-rows" aria-label="In deze lijst">
          {#each current as entry (entry.id)}
            <EntryRow {entry}>
              <button
                class="btn btn-ghost compact-button"
                type="button"
                onclick={() => onToggle(entry.id, false)}>Verwijderen</button
              >
            </EntryRow>
          {/each}
        </ul>
      {/if}
    </div>

    <div class="field">
      <label class="label" for="entry-search">Toevoegen</label>
      <input
        id="entry-search"
        class="text-input"
        type="search"
        placeholder="Zoek op Italiaans of Nederlands"
        autocomplete="off"
        bind:value={query}
      />
      <ul class="list-rows search-results" aria-label="Zoekresultaten">
        {#each available as entry (entry.id)}
          <EntryRow {entry}>
            <button
              class="btn btn-ghost compact-button"
              type="button"
              onclick={() => onToggle(entry.id, true)}>Toevoegen</button
            >
          </EntryRow>
        {:else}
          <li class="pl-intro">Niets gevonden.</li>
        {/each}
      </ul>
    </div>
  </div>
</main>
