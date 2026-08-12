<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import AppHeader from "$lib/components/AppHeader.svelte";
  import { buildAllCards, cardCounts } from "$lib/domain/cards";
  import { buildSessionItems, createSession, defaultMenuState } from "$lib/domain/session";
  import { clearSrs, loadSrs, record, saveSrs } from "$lib/domain/srs";
  import type { Progress, StudySession } from "$lib/domain/types";
  import MenuView from "$lib/views/MenuView.svelte";
  import PaperReviewView from "$lib/views/PaperReviewView.svelte";
  import StudyView from "$lib/views/StudyView.svelte";
  import SummaryView from "$lib/views/SummaryView.svelte";
  import type { PageProps } from "./$types";

  type AppView = "menu" | "session" | "paper-review" | "summary";

  let { data }: PageProps = $props();

  const cards = $derived(buildAllCards(data.deck));
  const counts = $derived(cardCounts(cards));
  const dataSummary = $derived(
    `${counts.verbCards} werkwoordskaarten (${counts.verbCount} werkwoorden × 5 tijden) + ${counts.wordCards} woorden`,
  );

  let menu = $state(defaultMenuState());
  let progress = $state<Progress>({});
  let storageOk = $state(true);
  let view = $state<AppView>("menu");
  let session = $state<StudySession | null>(null);
  let menuWarning = $state("");
  let resetNote = $state("");
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  onMount(() => {
    const loaded = loadSrs(window.localStorage);
    progress = loaded.progress;
    storageOk = loaded.ok;

    return () => clearTimeout(resetTimer);
  });

  function scrollTop() {
    if (browser) window.scrollTo({ top: 0, behavior: "instant" });
  }

  function startSession() {
    const items = buildSessionItems(cards, menu, progress);

    if (items.length === 0) {
      menuWarning =
        "Geen kaarten met deze keuzes. Zet minstens één tijd aan, of vink woorden aan.";
      return;
    }

    menuWarning = "";
    session = createSession(menu, items);
    view = "session";
    scrollTop();
  }

  function goToMenu() {
    view = "menu";
    scrollTop();
  }

  function reveal() {
    if (!session || view !== "session" || session.phase !== "prompt") return;
    session.phase = "revealed";
  }

  function grade(correct: boolean) {
    if (!session || view !== "session" || session.phase !== "revealed") return;

    const item = session.items[session.idx];
    session.phase = "grading";
    if (correct) session.correct += 1;

    progress = record(progress, item.card.id, correct);
    storageOk = saveSrs(progress, window.localStorage);
    advanceDirect();
  }

  function advanceDirect() {
    if (!session) return;

    session.idx += 1;
    if (session.idx >= session.items.length) {
      view = "summary";
    } else {
      session.phase = "prompt";
    }
    scrollTop();
  }

  function advancePaper() {
    if (!session || view !== "session" || session.phase !== "paper-prompt") return;

    session.idx += 1;
    if (session.idx >= session.items.length) view = "paper-review";
    scrollTop();
  }

  function processPaper(results: boolean[]) {
    if (!session || view !== "paper-review" || results.length !== session.items.length) return;

    let nextProgress = progress;
    session.correct = 0;

    results.forEach((correct, index) => {
      if (correct) session!.correct += 1;
      nextProgress = record(nextProgress, session!.items[index].card.id, correct);
    });

    progress = nextProgress;
    storageOk = saveSrs(progress, window.localStorage);
    view = "summary";
    scrollTop();
  }

  function resetProgress() {
    if (!window.confirm("Alle voortgang in deze browser wissen?")) return;

    progress = {};
    storageOk = clearSrs(window.localStorage);
    resetNote = "Voortgang gewist.";
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => (resetNote = ""), 2000);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!session || view !== "session" || event.repeat) return;

    if (
      session.phase === "prompt" &&
      (event.key === "Enter" || event.key === " " || event.key === "ArrowDown")
    ) {
      event.preventDefault();
      reveal();
      return;
    }

    if (session.phase === "revealed") {
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "g") {
        event.preventDefault();
        grade(true);
      } else if (event.key === "ArrowLeft" || event.key.toLowerCase() === "f") {
        event.preventDefault();
        grade(false);
      }
      return;
    }

    if (
      session.phase === "paper-prompt" &&
      (event.key === "Enter" || event.key === " " || event.key === "ArrowRight")
    ) {
      event.preventDefault();
      advancePaper();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="wrap">
  <AppHeader summary={dataSummary} />

  {#if view === "menu"}
    <MenuView
      bind:menu
      warning={menuWarning}
      {resetNote}
      onStart={startSession}
      onReset={resetProgress}
    />
  {:else if view === "session" && session}
    <StudyView
      {session}
      onBack={goToMenu}
      onReveal={reveal}
      onGrade={grade}
      onPaperNext={advancePaper}
    />
  {:else if view === "paper-review" && session}
    <PaperReviewView {session} onBack={goToMenu} onProcess={processPaper} />
  {:else if view === "summary" && session}
    <SummaryView {session} {progress} {storageOk} onAgain={goToMenu} />
  {/if}
</div>
