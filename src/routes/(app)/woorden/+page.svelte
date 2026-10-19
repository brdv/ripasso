<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { getAppState } from "$lib/state/app.svelte";
  import MyEntriesView from "$lib/views/MyEntriesView.svelte";

  const app = getAppState();
</script>

<svelte:head><title>Woorden · Ripasso</title></svelte:head>

<MyEntriesView
  entries={app.ownEntries}
  storageOk={app.entriesStorageOk}
  storageWarning={app.storageWarning}
  onCreateWord={() => goto(resolve("/woorden/nieuw?soort=woord"))}
  onCreateVerb={() => goto(resolve("/woorden/nieuw?soort=werkwoord"))}
  onEdit={(id) => goto(resolve("/(app)/woorden/[id]/bewerken", { id }))}
  onDelete={(id) => app.deleteEntry(id)}
/>
