<script lang="ts">
  import { resolve } from "$app/paths";
  import { WORDTYPE_NL } from "$lib/domain/constants";
  import { entryName } from "$lib/domain/search";
  import type { StudyEntry } from "$lib/domain/types";
  import type { Snippet } from "svelte";

  let {
    entry,
    badge,
    linked = false,
    children,
  }: {
    entry: StudyEntry;
    badge?: string;
    /** Makes the whole row a link to the entry's page. */
    linked?: boolean;
    children?: Snippet;
  } = $props();

  const kind = $derived(
    entry.type === "verb" ? "werkwoord" : (WORDTYPE_NL[entry.wordType ?? ""] ?? "woord"),
  );
</script>

<li class="list-row" class:list-row-linked={linked}>
  <span class="list-row-main">
    <span class="list-row-name">
      {#if linked}
        <!-- The link covers the whole row; the actions sit above it. -->
        <a class="row-link lang-it" href={resolve("/(app)/woorden/[id]", { id: encodeURIComponent(entry.id) })}
          >{entryName(entry)}</a
        >
      {:else}
        <span class="lang-it">{entryName(entry)}</span>
      {/if}
      {#if badge}<span class="badge">{badge}</span>{/if}
    </span>
    <span class="list-row-meta">{entry.nl} · {kind}</span>
  </span>
  <span class="list-row-actions">{@render children?.()}</span>
</li>
