<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { hasEntry } from "$lib/domain/lists";
  import { entryName } from "$lib/domain/search";
  import { getAppState } from "$lib/state/app.svelte";
  import EntryDetailView from "$lib/views/EntryDetailView.svelte";

  const app = getAppState();
  const entry = $derived(app.entries.find((candidate) => candidate.id === page.params.id));
  const lists = $derived(entry ? app.lists.filter((list) => hasEntry(list, entry.id)) : []);

  function remove() {
    if (!entry) return;
    app.deleteEntry(entry.id);
    goto(resolve("/woorden"));
  }
</script>

<svelte:head><title>{entry ? entryName(entry) : "Woord"} · Ripasso</title></svelte:head>

{#if entry}
  <EntryDetailView
    {entry}
    own={app.ownIds.has(entry.id)}
    {lists}
    onDelete={remove}
  />
{:else if app.ready}
  <main class="card-pane">
    <p class="pl-intro">Dit woord bestaat niet (meer).</p>
    <a class="btn btn-ghost compact-button" href={resolve("/woorden")}>Naar woorden</a>
  </main>
{/if}
