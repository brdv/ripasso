<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { getAppState } from "$lib/state/app.svelte";
  import PaperReviewView from "$lib/views/PaperReviewView.svelte";
  import StudyView from "$lib/views/StudyView.svelte";
  import SummaryView from "$lib/views/SummaryView.svelte";
  import { onMount } from "svelte";

  const app = getAppState();
  const session = $derived(app.session);

  // A session only exists in memory; after a reload there is nothing to show here.
  onMount(() => {
    if (!app.session) goto(resolve("/"), { replaceState: true });
  });

  $effect(() => {
    // Every new card and view starts at the top.
    void [session?.idx, app.sessionView];
    window.scrollTo({ top: 0, behavior: "instant" });
  });

  function stop() {
    goto(resolve("/"));
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!session || app.sessionView !== "session" || event.repeat) return;

    if (session.phase === "prompt" && (event.key === "Enter" || event.key === " " || event.key === "ArrowDown")) {
      event.preventDefault();
      app.reveal();
      return;
    }

    if (session.phase === "revealed") {
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "g") {
        event.preventDefault();
        app.grade(true);
      } else if (event.key === "ArrowLeft" || event.key.toLowerCase() === "f") {
        event.preventDefault();
        app.grade(false);
      }
      return;
    }

    if (
      session.phase === "paper-prompt" &&
      (event.key === "Enter" || event.key === " " || event.key === "ArrowRight")
    ) {
      event.preventDefault();
      app.advancePaper();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if session}
  {#if app.sessionView === "session"}
    <StudyView
      {session}
      onBack={stop}
      onReveal={() => app.reveal()}
      onGrade={(correct) => app.grade(correct)}
      onPaperNext={() => app.advancePaper()}
    />
  {:else if app.sessionView === "paper-review"}
    <PaperReviewView {session} onBack={stop} onProcess={(results) => app.processPaper(results)} />
  {:else}
    <SummaryView
      {session}
      progress={app.progress}
      storageOk={app.storageOk}
      inAccount={Boolean(app.user)}
      onAgain={stop}
    />
  {/if}
{/if}
