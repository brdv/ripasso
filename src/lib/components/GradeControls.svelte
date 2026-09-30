<script lang="ts">
  let { onGrade }: { onGrade: (correct: boolean) => void } = $props();
</script>

<div class="grade-row">
  <button class="btn btn-bad" type="button" onclick={() => onGrade(false)}>
    Fout <kbd>←</kbd>
  </button>
  <button class="btn btn-good" type="button" onclick={() => onGrade(true)}>
    Goed <kbd>→</kbd>
  </button>
</div>
