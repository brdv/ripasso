<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { StudyEntry } from "$lib/domain/types";
  import { getAppState } from "$lib/state/app.svelte";
  import VerbFormView from "$lib/views/VerbFormView.svelte";
  import WordFormView from "$lib/views/WordFormView.svelte";

  const app = getAppState();
  // Only own entries can be edited.
  const entry = $derived(app.ownEntries.find((own) => own.id === page.params.id));
  // Opened from the list editor: go back there, otherwise to the entry's page.
  const listId = $derived(page.url.searchParams.get("lijst"));

  function close() {
    goto(
      listId
        ? resolve("/(app)/lijsten/[id]", { id: listId })
        : resolve("/(app)/woorden/[id]", { id: encodeURIComponent(page.params.id ?? "") }),
    );
  }

  function save(saved: StudyEntry) {
    app.saveEntry(saved);
    close();
  }
</script>

<svelte:head><title>Bewerken · Ripasso</title></svelte:head>

{#if entry}
  {#key entry.id}
    {#if entry.type === "verb"}
      <VerbFormView {entry} entries={app.entries} onSave={save} onCancel={close} />
    {:else}
      <WordFormView {entry} entries={app.entries} onSave={save} onCancel={close} />
    {/if}
  {/key}
{:else if app.ready}
  <main class="card-pane">
    <p class="pl-intro">Dit woord bestaat niet of is niet van jou.</p>
    <a class="btn btn-ghost compact-button" href={resolve("/woorden")}>Naar woorden</a>
  </main>
{/if}
