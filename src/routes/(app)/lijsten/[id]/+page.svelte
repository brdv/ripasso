<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { getAppState } from "$lib/state/app.svelte";
  import ListEditorView from "$lib/views/ListEditorView.svelte";

  const app = getAppState();
  const list = $derived(app.lists.find((existing) => existing.id === page.params.id && !existing.readOnly));

  function create(kind: "woord" | "werkwoord") {
    if (!list) return;
    goto(resolve(`/woorden/nieuw?soort=${kind}&lijst=${encodeURIComponent(list.id)}`));
  }
</script>

<svelte:head><title>{list?.name ?? "Lijst"} · Ripasso</title></svelte:head>

{#if list}
  {#key list.id}
    <ListEditorView
      {list}
      entries={app.entries}
      ownIds={app.ownIds}
      onBack={() => goto(resolve("/lijsten"))}
      onCreateWord={() => create("woord")}
      onCreateVerb={() => create("werkwoord")}
      onRename={(name) => app.renameList(list.id, name)}
      onToggle={(entryId, include) => app.toggleListEntry(list.id, entryId, include)}
    />
  {/key}
{:else if app.ready}
  <main class="card-pane">
    <p class="pl-intro">Deze lijst bestaat niet (meer).</p>
    <a class="btn btn-ghost compact-button" href={resolve("/lijsten")}>Naar lijsten</a>
  </main>
{/if}
