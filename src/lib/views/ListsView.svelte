<script lang="ts">
  import { formatListCounts, listCounts } from "$lib/domain/lists";
  import type { PracticeList, StudyEntry } from "$lib/domain/types";

  let {
    lists,
    entries,
    storageOk = true,
    storageWarning = "",
    onBack,
    onCreate,
    onEdit,
    onDelete,
    onMyEntries,
    canShare = false,
    onShare,
    onUnshare,
  }: {
    lists: PracticeList[];
    entries: StudyEntry[];
    storageOk?: boolean;
    storageWarning?: string;
    onBack: () => void;
    onCreate: (name: string) => string | void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onMyEntries: () => void;
    canShare?: boolean;
    onShare?: (id: string) => void;
    onUnshare?: (id: string) => void;
  } = $props();

  let copiedId = $state<string | null>(null);

  function shareUrl(slug: string): string {
    return `${window.location.origin}/l/${slug}`;
  }

  async function copyLink(list: PracticeList) {
    if (!list.shareSlug) return;
    try {
      await navigator.clipboard.writeText(shareUrl(list.shareSlug));
      copiedId = list.id;
    } catch {
      copiedId = null;
    }
  }

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
    <button class="btn btn-ghost compact-button" type="button" onclick={onMyEntries}>Mijn woorden</button>
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
          <li class="list-row list-row-wrap">
            <span class="list-row-main">
              <span class="list-row-name">
                {list.name}
                {#if list.readOnly}<span class="badge">vast</span>{/if}
              </span>
              <span class="list-row-meta">{formatListCounts(listCounts(list, entries))}</span>
            </span>
            {#if !list.readOnly}
              <span class="list-row-actions">
                <button class="btn btn-ghost compact-button" type="button" onclick={() => onEdit(list.id)}>
                  Bewerken
                </button>
                <button class="linkbtn" type="button" onclick={() => remove(list)}>Verwijderen</button>
              </span>
              {#if canShare}
                <div class="share-block">
                  {#if list.shareSlug}
                    <div class="share-row">
                      <input
                        class="text-input"
                        type="text"
                        readonly
                        aria-label={`Link naar ${list.name}`}
                        value={shareUrl(list.shareSlug)}
                      />
                      <button class="btn btn-ghost compact-button" type="button" onclick={() => copyLink(list)}>
                        {copiedId === list.id ? "Gekopieerd" : "Kopieer"}
                      </button>
                    </div>
                    <button class="linkbtn" type="button" onclick={() => onUnshare?.(list.id)}>Stop met delen</button>
                  {:else}
                    <button class="linkbtn" type="button" onclick={() => onShare?.(list.id)}>Deel lijst</button>
                  {/if}
                </div>
              {/if}
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  {#if !storageOk}
    <p class="storage-warning" role="alert">{storageWarning}</p>
  {/if}
</main>
