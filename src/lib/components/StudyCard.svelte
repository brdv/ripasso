<script lang="ts">
  import { composeHint } from "$lib/domain/cards";
  import {
    answerFor,
    answerLanguageFor,
    promptFor,
    promptLabelFor,
    promptLanguageFor,
  } from "$lib/domain/presentation";
  import type { ReviewFlow, SessionItem, SessionPhase } from "$lib/domain/types";
  import CardMeta from "./CardMeta.svelte";
  import GradeControls from "./GradeControls.svelte";
  import HintPanel from "./HintPanel.svelte";

  let {
    item,
    phase,
    flow,
    position,
    isLast,
    onReveal,
    onGrade,
    onPaperNext,
  }: {
    item: SessionItem;
    phase: SessionPhase;
    flow: ReviewFlow;
    position: number;
    isLast: boolean;
    onReveal: () => void;
    onGrade: (correct: boolean) => void;
    onPaperNext: () => void;
  } = $props();

  let hintOpen = $state(false);
  const hint = $derived(composeHint(item.card, item.dir));
  const isPaper = $derived(flow === "paper");
</script>

<article class="card-pane">
  <CardMeta card={item.card} />

  <div class="prompt">
    <div class="prompt-label">{promptLabelFor(item.dir)}</div>
    <div class={`prompt-word ${promptLanguageFor(item.dir)}`}>{promptFor(item)}</div>
  </div>

  {#if isPaper}
    <p class="reveal-hint">Schrijf je antwoord op (nummer {position}).</p>
    <button class="btn btn-primary btn-block" type="button" onclick={onPaperNext}>
      {isLast ? "Naar nakijken" : "Volgende vraag"}
    </button>
  {:else if phase === "prompt"}
    <p class="reveal-hint">Zeg of schrijf je antwoord - toon het dan.</p>
    <button class="btn btn-primary btn-block" type="button" onclick={onReveal}>Toon antwoord</button>
  {:else}
    <div class={`answer-reveal ${answerLanguageFor(item.dir)}`}>{answerFor(item)}</div>
    <GradeControls {onGrade} />
  {/if}

  <HintPanel {hint} bind:open={hintOpen} />
</article>
