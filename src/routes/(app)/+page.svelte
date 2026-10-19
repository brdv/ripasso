<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { getAppState } from "$lib/state/app.svelte";
  import MenuView from "$lib/views/MenuView.svelte";
  import { onDestroy } from "svelte";

  const app = getAppState();
  let resetNote = $state("");
  let resetTimer: ReturnType<typeof setTimeout> | undefined;
  onDestroy(() => clearTimeout(resetTimer));

  function start() {
    if (app.startSession()) goto(resolve("/sessie"));
  }

  function reset() {
    const question = app.user ? "Alle voortgang in je account wissen?" : "Alle voortgang in deze browser wissen?";
    if (!window.confirm(question)) return;
    app.resetProgress();
    resetNote = "Voortgang gewist.";
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => (resetNote = ""), 2000);
  }
</script>

<MenuView
  bind:menu={app.menu}
  bind:selectedListId={app.selectedListId}
  lists={app.menuLists}
  summary={app.dataSummary}
  warning={app.menuWarning}
  {resetNote}
  onStart={start}
  onReset={reset}
/>
