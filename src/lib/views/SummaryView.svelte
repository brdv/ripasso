<script lang="ts">
  import BoxDistribution from "$lib/components/BoxDistribution.svelte";
  import { boxDistribution } from "$lib/domain/session";
  import type { Progress, StudySession } from "$lib/domain/types";

  let {
    session,
    progress,
    storageOk,
    onAgain,
  }: {
    session: StudySession;
    progress: Progress;
    storageOk: boolean;
    onAgain: () => void;
  } = $props();

  const total = $derived(session.items.length);
  const percentage = $derived(Math.round((session.correct / total) * 100));
  const boxes = $derived(boxDistribution(session.items, progress));
</script>

<main>
  <section class="card-pane summary">
    <div class="summary-score">{session.correct} / {total} goed</div>
    <div class="summary-sub">{percentage}% in deze sessie · {total} kaarten</div>
    <BoxDistribution {boxes} />
    <div class="summary-storage">
      {#if storageOk}
        Voortgang opgeslagen in deze browser.
      {:else}
        Let op: opslag werkt niet in deze browser. Je kunt wel blijven oefenen, maar de voortgang blijft niet bewaard.
      {/if}
    </div>
    <div class="summary-actions">
      <button class="btn btn-ghost" type="button" onclick={onAgain}>Naar menu</button>
    </div>
  </section>
</main>
