<script lang="ts">
  import { parseRich, type RichNode } from "$lib/domain/rich-text";

  let { text }: { text: string } = $props();

  const nodes = $derived(parseRich(text));
</script>

{#snippet render(nodes: RichNode[])}
  {#each nodes as node, index (index)}
    {#if typeof node === "string"}{node}{:else if node.mark === "bold"}<strong>{@render render(node.children)}</strong
      >{:else if node.mark === "italian"}<em class="lang-it">{@render render(node.children)}</em
      >{:else}<span class={`theory-chip theory-chip-${node.mark}`}>{@render render(node.children)}</span>{/if}
  {/each}
{/snippet}

{@render render(nodes)}
