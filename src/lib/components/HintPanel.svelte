<script lang="ts">
  import type { Hint } from "$lib/domain/types";

  let { hint, open = $bindable(false) }: { hint: Hint; open?: boolean } = $props();
</script>

<div class="hint-bar">
  <button
    class="btn btn-ghost hint-button"
    type="button"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    {open ? "Verberg hint" : "Hint / uitleg"}
  </button>

  {#if open}
    <div class="hint-panel">
      <dl class="hint-dl">
        {#each hint.rows as [term, description] (`${term}:${description}`)}
          <dt>{term}</dt>
          <dd>{description}</dd>
        {/each}
      </dl>
      {#if hint.note}
        <p class="hint-note">{hint.note}</p>
      {/if}
    </div>
  {/if}
</div>
