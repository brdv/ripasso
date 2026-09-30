<script lang="ts">
  let { boxes }: { boxes: number[] } = $props();
  const total = $derived(boxes.reduce((sum, count) => sum + count, 0));
</script>

<div class="boxes" aria-label="Verdeling over leerboxen">
  {#each boxes as count, index}
    <div class="boxbar">
      <span class="boxbar-label">box {index + 1}</span>
      <span class="boxbar-track">
        <span class="boxbar-fill" style:width={`${total ? (count / total) * 100 : 0}%`}></span>
      </span>
      <span class="boxbar-count">{count}</span>
    </div>
  {/each}
</div>
