<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { getAppState } from "$lib/state/app.svelte";
  import WordsView from "$lib/views/WordsView.svelte";

  const app = getAppState();
</script>

<svelte:head><title>Woorden · Ripasso</title></svelte:head>

<WordsView
  entries={app.entries}
  ownIds={app.ownIds}
  bind:filter={app.wordsFilter}
  storageOk={app.entriesStorageOk}
  storageWarning={app.storageWarning}
  onCreateWord={() => goto(resolve("/woorden/nieuw?soort=woord"))}
  onCreateVerb={() => goto(resolve("/woorden/nieuw?soort=werkwoord"))}
/>
