<script lang="ts">
  import type { StudySession } from "$lib/domain/types";
  import ProgressHeader from "$lib/components/ProgressHeader.svelte";
  import StudyCard from "$lib/components/StudyCard.svelte";

  let {
    session,
    onBack,
    onReveal,
    onGrade,
    onPaperNext,
  }: {
    session: StudySession;
    onBack: () => void;
    onReveal: () => void;
    onGrade: (correct: boolean) => void;
    onPaperNext: () => void;
  } = $props();

  const item = $derived(session.items[session.idx]);
</script>

<main>
  <ProgressHeader current={session.idx + 1} total={session.items.length} {onBack} />
  {#key item.card.id}
    <StudyCard
      {item}
      phase={session.phase}
      flow={session.state.flow}
      position={session.idx + 1}
      isLast={session.idx + 1 === session.items.length}
      {onReveal}
      {onGrade}
      {onPaperNext}
    />
  {/key}
</main>
