<script lang="ts">
  import { GENDER_NL, NUMBER_NL, WORDTYPE_NL } from "$lib/domain/constants";
  import {
    ARTICLES,
    GENDERS,
    NUMBERS,
    validateWord,
    WORD_TYPES,
    wordDraftFrom,
    type WordField,
  } from "$lib/domain/entry-validation";
  import type { StudyEntry, WordEntry } from "$lib/domain/types";
  import { untrack } from "svelte";

  let {
    entry,
    entries,
    onSave,
    onCancel,
  }: {
    entry?: WordEntry;
    entries: StudyEntry[];
    onSave: (entry: WordEntry) => void;
    onCancel: () => void;
  } = $props();

  // The form owns its draft; the parent remounts it for another entry.
  const id = untrack(() => entry?.id ?? `word:${crypto.randomUUID()}`);
  let draft = $state(untrack(() => wordDraftFrom(entry)));
  let errors = $state<Partial<Record<WordField, string>>>({});
  let submitted = $state(false);

  const result = $derived(validateWord(draft, entries, id));
  const isNoun = $derived(draft.wordType === "noun");

  function submit(event: SubmitEvent) {
    event.preventDefault();
    submitted = true;
    errors = result.errors;
    if (result.value) onSave(result.value);
  }
</script>

<main>
  <div class="topbar">
    <button class="btn btn-ghost compact-button" type="button" onclick={onCancel}>Terug</button>
    <h1 class="view-title">{entry ? "Woord bewerken" : "Nieuw woord"}</h1>
  </div>

  <form class="card-pane" onsubmit={submit} novalidate>
    <div class="field">
      <label class="label" for="word-it">Italiaans</label>
      <input id="word-it" class="text-input lang-it" type="text" autocomplete="off" bind:value={draft.it} />
      <div class="field-error">{errors.it ?? ""}</div>
    </div>

    <div class="field">
      <label class="label" for="word-nl">Nederlands</label>
      <input id="word-nl" class="text-input" type="text" autocomplete="off" bind:value={draft.nl} />
      <div class="field-error">{errors.nl ?? ""}</div>
    </div>

    <div class="field">
      <label class="label" for="word-type">Woordsoort</label>
      <select id="word-type" class="text-input" bind:value={draft.wordType}>
        {#each WORD_TYPES as type (type)}
          <option value={type}>{WORDTYPE_NL[type]}</option>
        {/each}
      </select>
      <div class="field-error">{errors.wordType ?? ""}</div>
    </div>

    {#if isNoun}
      <div class="form-grid">
        <div class="field">
          <label class="label" for="word-article">Lidwoord</label>
          <select id="word-article" class="text-input" bind:value={draft.article}>
            <option value="">—</option>
            {#each ARTICLES as article (article)}
              <option value={article}>{article}</option>
            {/each}
          </select>
          <div class="field-error">{errors.article ?? ""}</div>
        </div>
        <div class="field">
          <label class="label" for="word-gender">Geslacht</label>
          <select id="word-gender" class="text-input" bind:value={draft.gender}>
            <option value="">—</option>
            {#each GENDERS as gender (gender)}
              <option value={gender}>{GENDER_NL[gender]}</option>
            {/each}
          </select>
          <div class="field-error">{errors.gender ?? ""}</div>
        </div>
        <div class="field">
          <label class="label" for="word-number">Getal</label>
          <select id="word-number" class="text-input" bind:value={draft.number}>
            <option value="">—</option>
            {#each NUMBERS as number (number)}
              <option value={number}>{NUMBER_NL[number]}</option>
            {/each}
          </select>
          <div class="field-error">{errors.number ?? ""}</div>
        </div>
      </div>
    {/if}

    {#each result.warnings as warning (warning)}
      <p class="form-warning" role="status">{warning}</p>
    {/each}
    {#if submitted && !result.value}
      <p class="field-error" role="alert">Controleer de gemarkeerde velden.</p>
    {/if}

    <button class="btn btn-primary btn-block" type="submit">Opslaan</button>
  </form>
</main>
