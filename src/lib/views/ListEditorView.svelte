<script lang="ts">
  import { resolve } from "$app/paths";
  import EntryFilters from "$lib/components/EntryFilters.svelte";
  import EntryRow from "$lib/components/EntryRow.svelte";
  import { formatListCounts, listCounts, listEntries } from "$lib/domain/lists";
  import { emptyFilter, filterEntries, sortEntries } from "$lib/domain/search";
  import type { EntryId, PracticeList, StudyEntry } from "$lib/domain/types";
  import { untrack } from "svelte";
  import { MediaQuery } from "svelte/reactivity";

  let {
    list,
    entries,
    ownIds = new Set(),
    onBack,
    onCreateWord,
    onCreateVerb,
    onRename,
    onToggle,
  }: {
    list: PracticeList;
    entries: StudyEntry[];
    ownIds?: ReadonlySet<EntryId>;
    onBack: () => void;
    onCreateWord: () => void;
    onCreateVerb: () => void;
    onRename: (name: string) => string | void;
    onToggle: (entryId: EntryId, include: boolean) => void;
  } = $props();

  // Wide screens show the available entries and the list side by side; narrow screens show one
  // list where each row toggles in place.
  const wide = new MediaQuery("min-width: 900px");

  // Seeded once from the list; the editor owns the draft name while it is open.
  let name = $state(untrack(() => list.name));
  let nameError = $state("");
  let filter = $state(emptyFilter());
  let onlyInList = $state(false);

  const current = $derived(listEntries(list, entries));
  const included = $derived(new Set(current.map((entry) => entry.id)));
  const sorted = $derived(sortEntries(entries));
  const currentShown = $derived(filterEntries(current, filter, ownIds));
  const availableShown = $derived(
    filterEntries(sorted, filter, ownIds).filter((entry) => !included.has(entry.id)),
  );
  const allShown = $derived(
    filterEntries(sorted, filter, ownIds).filter((entry) => !onlyInList || included.has(entry.id)),
  );

  function rename() {
    const result = onRename(name);
    nameError = typeof result === "string" ? result : "";
  }
</script>

{#snippet editLink(entry: StudyEntry)}
  {#if ownIds.has(entry.id)}
    <a
      class="linkbtn"
      href={resolve(`/woorden/${encodeURIComponent(entry.id)}/bewerken?lijst=${encodeURIComponent(list.id)}`)}
      >Bewerken</a
    >
  {/if}
{/snippet}

<main class="page-wide">
  <div class="topbar">
    <button class="btn btn-ghost compact-button" type="button" onclick={onBack}>Terug</button>
    <h1 class="view-title">Lijst bewerken</h1>
    <div class="action-row topbar-actions">
      <button class="btn btn-ghost compact-button" type="button" onclick={onCreateWord}>Nieuw woord</button>
      <button class="btn btn-ghost compact-button" type="button" onclick={onCreateVerb}>Nieuw werkwoord</button>
    </div>
  </div>

  <div class="card-pane">
    <div class="editor-head">
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
      <div class="field list-total">
        <div class="label">In deze lijst</div>
        <div class="list-total-counts">{formatListCounts(listCounts(list, entries))}</div>
      </div>
    </div>

    <div class="field">
      <EntryFilters bind:filter id="list-search">
        {#if !wide.current}
          <label class="chk">
            <input type="checkbox" bind:checked={onlyInList} />
            <span>In deze lijst ({current.length})</span>
          </label>
        {/if}
      </EntryFilters>
    </div>

    {#if wide.current}
      <div class="editor-columns">
        <section class="field">
          <h2 class="label">Beschikbaar · {availableShown.length}</h2>
          <ul class="list-rows editor-column" aria-label="Beschikbaar">
            {#each availableShown as entry (entry.id)}
              <EntryRow {entry} linked fromList={list.id} badge={ownIds.has(entry.id) ? "eigen" : undefined}>
                {@render editLink(entry)}
                <button class="btn btn-ghost compact-button" type="button" onclick={() => onToggle(entry.id, true)}
                  >Toevoegen</button
                >
              </EntryRow>
            {:else}
              <li class="pl-intro">Niets gevonden.</li>
            {/each}
          </ul>
        </section>
        <section class="field">
          <h2 class="label">In deze lijst · {currentShown.length}</h2>
          <ul class="list-rows editor-column" aria-label="In deze lijst">
            {#each currentShown as entry (entry.id)}
              <EntryRow {entry} linked fromList={list.id} badge={ownIds.has(entry.id) ? "eigen" : undefined}>
                {@render editLink(entry)}
                <button class="btn btn-ghost compact-button" type="button" onclick={() => onToggle(entry.id, false)}
                  >Verwijderen</button
                >
              </EntryRow>
            {:else}
              <li class="pl-intro">
                {current.length === 0 ? "Nog leeg. Voeg links woorden en werkwoorden toe." : "Niets gevonden."}
              </li>
            {/each}
          </ul>
        </section>
      </div>
    {:else}
      <ul class="list-rows" aria-label="Woorden">
        {#each allShown as entry (entry.id)}
          {@const inList = included.has(entry.id)}
          <EntryRow {entry} linked fromList={list.id} badge={ownIds.has(entry.id) ? "eigen" : undefined}>
            {@render editLink(entry)}
            <button
              class="btn btn-ghost compact-button toggle-button"
              class:is-on={inList}
              type="button"
              aria-pressed={inList}
              onclick={() => onToggle(entry.id, !inList)}>{inList ? "✓ In lijst" : "Toevoegen"}</button
            >
          </EntryRow>
        {:else}
          <li class="pl-intro">
            {onlyInList && current.length === 0 ? "Nog leeg. Voeg woorden en werkwoorden toe." : "Niets gevonden."}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</main>
