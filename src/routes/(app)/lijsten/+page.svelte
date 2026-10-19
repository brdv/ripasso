<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { getAppState } from "$lib/state/app.svelte";
  import ListsView from "$lib/views/ListsView.svelte";

  const app = getAppState();

  function edit(id: string) {
    goto(resolve("/(app)/lijsten/[id]", { id }));
  }

  function create(name: string): string | void {
    const result = app.createList(name);
    if (typeof result === "string") return result;
    edit(result.id);
  }
</script>

<svelte:head><title>Lijsten · Ripasso</title></svelte:head>

<ListsView
  lists={app.lists}
  entries={app.entries}
  storageOk={app.listsStorageOk}
  storageWarning={app.storageWarning}
  onCreate={create}
  onEdit={edit}
  onDelete={(id) => app.deleteList(id)}
  canShare={Boolean(app.user)}
  onShare={(id) => app.shareList(id, true)}
  onUnshare={(id) => app.shareList(id, false)}
/>
