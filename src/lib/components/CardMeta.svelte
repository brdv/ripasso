<script lang="ts">
  import { PERSON_SHORT, TENSE_LABEL, WORDTYPE_NL } from "$lib/domain/constants";
  import type { Card } from "$lib/domain/types";

  let { card }: { card: Card } = $props();
</script>

<div class="chips" aria-label="Kaartdetails">
  {#if card.type === "verb"}
    <span class="chip chip-accent">{TENSE_LABEL[card.tense]}</span>
    <span class="chip chip-ghost">{PERSON_SHORT[card.person]}</span>
  {:else}
    <span class="chip chip-ghost">{WORDTYPE_NL[card.wordType ?? ""] ?? card.wordType ?? "woord"}</span>
  {/if}
</div>
