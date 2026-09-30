<script lang="ts">
  import { formatListCounts, listCounts } from "$lib/domain/lists";
  import type { PracticeList, StudyEntry } from "$lib/domain/types";

  let {
    lists,
    entries,
    storageOk = true,
    onBack,
    onCreate,
    onEdit,
    onDelete,
  }: {
    lists: PracticeList[];
    entries: StudyEntry[];
    storageOk?: boolean;
    onBack: () => void;
    onCreate: (name: string) => string | void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
  } = $props();

  let newName = $state("");
  let error = $state("");

  function create(event: SubmitEvent) {
    event.preventDefault();
    const result = onCreate(newName);
    if (typeof result === "string") {
      error = result;
      return;
    }
    newName = "";
    error = "";
  }

  function remove(list: PracticeList) {
    if (window.confirm(`Lijst "${list.name}" verwijderen?`)) onDelete(list.id);
  }
</script>

<main>
  <div class="topbar">
    <button class="btn btn-ghost compact-button" type="button" onclick={onBack}>Menu</button>
    <h1 class="view-title">Lijsten</h1>
  </div>

  <div class="card-pane">
    <form class="field" onsubmit={create}>
      <label class="label" for="new-list-name">Nieuwe lijst</label>
      <div class="source-row">
        <input
          id="new-list-name"
          class="text-input"
          type="text"
          placeholder="Naam van de lijst"
          autocomplete="off"
          bind:value={newName}
        />
        <button class="btn btn-primary compact-button" type="submit">Nieuwe lijst</button>
      </div>
      <div class="menu-warning" role="status">{error}</div>
    </form>

    {#if lists.length === 0}
      <p class="pl-intro">Je hebt nog geen lijsten.</p>
    {:else}
      <ul class="list-rows">
        {#each lists as list (list.id)}
          <li class="list-row">
            <span class="list-row-main">
              <span class="list-row-name">{list.name}</span>
              <span class="list-row-meta">{formatListCounts(listCounts(list, entries))}</span>
            </span>
            <span class="list-row-actions">
              <button class="btn btn-ghost compact-button" type="button" onclick={() => onEdit(list.id)}>
                Bewerken
              </button>
              <button class="linkbtn" type="button" onclick={() => remove(list)}>Verwijderen</button>
            </span>
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  {#if !storageOk}
    <p class="storage-warning" role="alert">
      Let op: opslag werkt niet in deze browser. Je kunt wel blijven oefenen, maar lijsten blijven niet
      bewaard.
    </p>
  {/if}
</main>
