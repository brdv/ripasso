<script lang="ts">
  import EntryRow from "$lib/components/EntryRow.svelte";
  import type { EntryId, StudyEntry } from "$lib/domain/types";

  let {
    entries,
    storageOk = true,
    onBack,
    onCreateWord,
    onEdit,
    onDelete,
  }: {
    entries: StudyEntry[];
    storageOk?: boolean;
    onBack: () => void;
    onCreateWord: () => void;
    onEdit: (id: EntryId) => void;
    onDelete: (id: EntryId) => void;
  } = $props();

  function remove(entry: StudyEntry) {
    const name = entry.type === "verb" ? entry.lemma : entry.it;
    if (window.confirm(`"${name}" verwijderen? Lijsten waarin het staat blijven werken.`)) {
      onDelete(entry.id);
    }
  }
</script>

<main>
  <div class="topbar">
    <button class="btn btn-ghost compact-button" type="button" onclick={onBack}>Lijsten</button>
    <h1 class="view-title">Mijn woorden</h1>
  </div>

  <div class="card-pane">
    <div class="field action-row">
      <button class="btn btn-primary compact-button" type="button" onclick={onCreateWord}>Nieuw woord</button>
    </div>

    {#if entries.length === 0}
      <p class="pl-intro">Je hebt nog geen eigen woorden.</p>
    {:else}
      <ul class="list-rows" aria-label="Mijn woorden">
        {#each entries as entry (entry.id)}
          <EntryRow {entry}>
            <button class="btn btn-ghost compact-button" type="button" onclick={() => onEdit(entry.id)}>
              Bewerken
            </button>
            <button class="linkbtn" type="button" onclick={() => remove(entry)}>Verwijderen</button>
          </EntryRow>
        {/each}
      </ul>
    {/if}
  </div>

  {#if !storageOk}
    <p class="storage-warning" role="alert">
      Let op: opslag werkt niet in deze browser. Eigen woorden blijven niet bewaard.
    </p>
  {/if}
</main>
