<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { StudyEntry } from "$lib/domain/types";
  import { getAppState } from "$lib/state/app.svelte";
  import VerbFormView from "$lib/views/VerbFormView.svelte";
  import WordFormView from "$lib/views/WordFormView.svelte";

  const app = getAppState();
  const isVerb = $derived(page.url.searchParams.get("soort") === "werkwoord");
  // Opened from the list editor: a new entry is added to that list and the editor reopens.
  const listId = $derived(page.url.searchParams.get("lijst") ?? undefined);

  function close() {
    goto(listId ? resolve("/(app)/lijsten/[id]", { id: listId }) : resolve("/woorden"));
  }

  function save(entry: StudyEntry) {
    app.saveEntry(entry, listId);
    close();
  }
</script>

<svelte:head><title>{isVerb ? "Nieuw werkwoord" : "Nieuw woord"} · Ripasso</title></svelte:head>

{#if app.ready}
  {#key isVerb}
    {#if isVerb}
      <VerbFormView entries={app.entries} onSave={save} onCancel={close} />
    {:else}
      <WordFormView entries={app.entries} onSave={save} onCancel={close} />
    {/if}
  {/key}
{/if}
