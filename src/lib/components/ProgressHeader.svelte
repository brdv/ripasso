<script lang="ts">
  let {
    current,
    total,
    label,
    onBack,
  }: {
    current?: number;
    total?: number;
    label?: string;
    onBack: () => void;
  } = $props();

  const percent = $derived(current !== undefined && total ? ((current - 1) / total) * 100 : 0);
</script>

<div class="topbar">
  <button class="btn btn-ghost compact-button" type="button" onclick={onBack}>Menu</button>
  <div class="progress">
    {#if current !== undefined && total !== undefined}
      <div class="progress-track" aria-hidden="true">
        <div class="progress-fill" style:width={`${percent}%`}></div>
      </div>
      <div class="progress-text">{current} / {total}</div>
    {:else if label}
      <div class="progress-text">{label}</div>
    {/if}
  </div>
</div>
