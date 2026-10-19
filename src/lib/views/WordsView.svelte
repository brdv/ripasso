<script lang="ts">
  import EntryFilters from "$lib/components/EntryFilters.svelte";
  import EntryRow from "$lib/components/EntryRow.svelte";
  import { formatListCounts } from "$lib/domain/lists";
  import { filterEntries, sortEntries, type EntryFilter } from "$lib/domain/search";
  import type { EntryId, StudyEntry } from "$lib/domain/types";

  let {
    entries,
    ownIds,
    filter = $bindable(),
    storageOk = true,
    storageWarning = "",
    onCreateWord,
    onCreateVerb,
  }: {
    entries: StudyEntry[];
    ownIds: ReadonlySet<EntryId>;
    filter: EntryFilter;
    storageOk?: boolean;
    storageWarning?: string;
    onCreateWord: () => void;
    onCreateVerb: () => void;
  } = $props();

  const sorted = $derived(sortEntries(entries));
  const shown = $derived(filterEntries(sorted, filter, ownIds));
  const counts = $derived.by(() => {
    const verbs = shown.filter((entry) => entry.type === "verb").length;
    return { verbs, words: shown.length - verbs };
  });
</script>

<main>
  <div class="topbar">
    <h1 class="view-title">Woorden</h1>
    <div class="action-row topbar-actions">
      <button class="btn btn-primary compact-button" type="button" onclick={onCreateWord}>Nieuw woord</button>
      <button class="btn btn-primary compact-button" type="button" onclick={onCreateVerb}>Nieuw werkwoord</button>
    </div>
  </div>

  <div class="card-pane">
    <div class="field">
      <EntryFilters bind:filter id="words-search" />
    </div>

    <div class="field">
      <div class="label">{formatListCounts(counts)}</div>
      <ul class="list-rows" aria-label="Woorden">
        {#each shown as entry (entry.id)}
          <EntryRow {entry} linked badge={ownIds.has(entry.id) ? "eigen" : undefined} />
        {:else}
          <li class="pl-intro">
            {filter.ownOnly && ownIds.size === 0 ? "Je hebt nog geen eigen woorden of werkwoorden." : "Niets gevonden."}
          </li>
        {/each}
      </ul>
    </div>
  </div>

  {#if !storageOk}
    <p class="storage-warning" role="alert">{storageWarning}</p>
  {/if}
</main>
