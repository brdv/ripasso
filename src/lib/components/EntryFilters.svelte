<script lang="ts">
  import type { EntryFilter } from "$lib/domain/search";
  import type { Snippet } from "svelte";

  let {
    filter = $bindable(),
    id = "entry-search",
    label = "Zoeken",
    children,
  }: { filter: EntryFilter; id?: string; label?: string; children?: Snippet } = $props();
</script>

<div class="entry-filters">
  <label class="label" for={id}>{label}</label>
  <input
    {id}
    class="text-input"
    type="search"
    placeholder="Zoek op Italiaans of Nederlands"
    autocomplete="off"
    bind:value={filter.query}
  />
  <div class="check-group filter-options" role="group" aria-label="Filter">
    <label class="chk">
      <input type="radio" name={`${id}-kind`} value="all" bind:group={filter.kind} />
      <span>Alles</span>
    </label>
    <label class="chk">
      <input type="radio" name={`${id}-kind`} value="verb" bind:group={filter.kind} />
      <span>Werkwoorden</span>
    </label>
    <label class="chk">
      <input type="radio" name={`${id}-kind`} value="word" bind:group={filter.kind} />
      <span>Woorden</span>
    </label>
    <label class="chk">
      <input type="checkbox" bind:checked={filter.ownOnly} />
      <span>Alleen eigen</span>
    </label>
    {@render children?.()}
  </div>
</div>
