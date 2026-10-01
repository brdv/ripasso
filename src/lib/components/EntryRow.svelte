<script lang="ts">
  import { WORDTYPE_NL } from "$lib/domain/constants";
  import type { StudyEntry } from "$lib/domain/types";
  import type { Snippet } from "svelte";

  let { entry, badge, children }: { entry: StudyEntry; badge?: string; children?: Snippet } =
    $props();

  const italian = $derived(entry.type === "verb" ? entry.lemma : entry.it);
  const kind = $derived(
    entry.type === "verb" ? "werkwoord" : (WORDTYPE_NL[entry.wordType ?? ""] ?? "woord"),
  );
</script>

<li class="list-row">
  <span class="list-row-main">
    <span class="list-row-name">
      <span class="lang-it">{italian}</span>
      {#if badge}<span class="badge">{badge}</span>{/if}
    </span>
    <span class="list-row-meta">{entry.nl} · {kind}</span>
  </span>
  <span class="list-row-actions">{@render children?.()}</span>
</li>
