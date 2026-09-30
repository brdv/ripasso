<script lang="ts">
  import PaperReviewRow from "$lib/components/PaperReviewRow.svelte";
  import ProgressHeader from "$lib/components/ProgressHeader.svelte";
  import type { StudySession } from "$lib/domain/types";

  let {
    session,
    onBack,
    onProcess,
  }: {
    session: StudySession;
    onBack: () => void;
    onProcess: (results: boolean[]) => void;
  } = $props();

  let marks = $state<Record<number, boolean>>({});
  const results = $derived(session.items.map((_, index) => Boolean(marks[index])));
  const goodCount = $derived(results.filter(Boolean).length);
  const wrongCount = $derived(session.items.length - goodCount);
</script>

<main>
  <ProgressHeader label={`Nakijken - ${session.items.length} kaarten`} {onBack} />

  <div class="card-pane">
    <p class="pl-intro">Vink aan wat je goed had. De rest telt als fout.</p>
    <div class="pl-rows">
      {#each session.items as item, index (item.card.id)}
        <PaperReviewRow
          {item}
          {index}
          checked={Boolean(marks[index])}
          onChange={(checked) => (marks[index] = checked)}
        />
      {/each}
    </div>
  </div>

  <div class="start-wrap">
    <button class="btn btn-primary btn-block" type="button" onclick={() => onProcess(results)}>
      Verwerk: {goodCount} goed, {wrongCount} fout
    </button>
    <div class="pl-counter">{goodCount} goed · {wrongCount} fout</div>
  </div>
</main>
