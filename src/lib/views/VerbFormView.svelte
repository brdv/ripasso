<script lang="ts">
  import { PERSON_SHORT, PERSONS, TENSE_LABEL, TENSES } from "$lib/domain/constants";
  import {
    AUXILIARIES,
    CONJUGATION_CLASSES,
    REGULARITY_SUGGESTIONS,
    validateVerb,
    verbDraftFrom,
    type VerbField,
  } from "$lib/domain/entry-validation";
  import type { StudyEntry, VerbEntry } from "$lib/domain/types";
  import { untrack } from "svelte";

  let {
    entry,
    entries,
    onSave,
    onCancel,
  }: {
    entry?: VerbEntry;
    entries: StudyEntry[];
    onSave: (entry: VerbEntry) => void;
    onCancel: () => void;
  } = $props();

  // The form owns its draft; the parent remounts it for another entry.
  const id = untrack(() => entry?.id ?? `verb:${crypto.randomUUID()}`);
  let draft = $state(untrack(() => verbDraftFrom(entry)));
  let errors = $state<Partial<Record<VerbField, string>>>({});
  let submitted = $state(false);

  const result = $derived(validateVerb(draft, entries, id));
  const filledPerTense = $derived(
    Object.fromEntries(
      TENSES.map((tense) => [
        tense,
        PERSONS.filter((person) => draft.forms[tense][person].it.trim() || draft.forms[tense][person].nl.trim())
          .length,
      ]),
    ),
  );

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
    <h1 class="view-title">{entry ? "Werkwoord bewerken" : "Nieuw werkwoord"}</h1>
  </div>

  <form class="card-pane" onsubmit={submit} novalidate>
    <div class="field">
      <label class="label" for="verb-lemma">Infinitief (Italiaans)</label>
      <input id="verb-lemma" class="text-input lang-it" type="text" autocomplete="off" bind:value={draft.lemma} />
      <div class="field-error">{errors.lemma ?? ""}</div>
    </div>

    <div class="field">
      <label class="label" for="verb-nl">Nederlands</label>
      <input id="verb-nl" class="text-input" type="text" autocomplete="off" bind:value={draft.nl} />
      <div class="field-error">{errors.nl ?? ""}</div>
    </div>

    <div class="form-grid">
      <div class="field">
        <label class="label" for="verb-auxiliary">Hulpww.</label>
        <select id="verb-auxiliary" class="text-input" bind:value={draft.auxiliary}>
          <option value="">—</option>
          {#each AUXILIARIES as auxiliary (auxiliary)}
            <option value={auxiliary}>{auxiliary}</option>
          {/each}
        </select>
        <div class="field-error">{errors.auxiliary ?? ""}</div>
      </div>
      <div class="field">
        <label class="label" for="verb-class">Groep</label>
        <select id="verb-class" class="text-input" bind:value={draft.conjugationClass}>
          <option value="">—</option>
          {#each CONJUGATION_CLASSES as conjugationClass (conjugationClass)}
            <option value={conjugationClass}>{conjugationClass}</option>
          {/each}
        </select>
        <div class="field-error">{errors.conjugationClass ?? ""}</div>
      </div>
      <div class="field">
        <label class="label" for="verb-regularity">Soort</label>
        <input
          id="verb-regularity"
          class="text-input"
          type="text"
          list="regularity-suggestions"
          autocomplete="off"
          bind:value={draft.regularity}
        />
        <datalist id="regularity-suggestions">
          {#each REGULARITY_SUGGESTIONS as suggestion (suggestion)}
            <option value={suggestion}></option>
          {/each}
        </datalist>
      </div>
    </div>

    <div class="field">
      <label class="label" for="verb-note">Notitie</label>
      <textarea id="verb-note" class="text-input" rows="2" bind:value={draft.note}></textarea>
    </div>

    <div class="field">
      <div class="label">Vervoegingen</div>
      <p class="pl-intro">
        Vul alleen de vormen in die je wilt oefenen. Elke vorm heeft Italiaans én Nederlands nodig.
      </p>
      {#each TENSES as tense, index (tense)}
        <details class="tense-block" open={index === 0 || filledPerTense[tense] > 0}>
          <summary>
            {TENSE_LABEL[tense]}
            <span class="list-row-meta">{filledPerTense[tense]} / {PERSONS.length}</span>
          </summary>
          <div class="grid-scroll">
            <table class="form-table">
              <thead>
                <tr><th scope="col"></th><th scope="col">Italiaans</th><th scope="col">Nederlands</th></tr>
              </thead>
              <tbody>
                {#each PERSONS as person (person)}
                  {@const cellError = errors[`forms.${tense}.${person}`]}
                  <tr class:has-error={Boolean(cellError)}>
                    <th scope="row">{PERSON_SHORT[person]}</th>
                    <td>
                      <input
                        class="text-input lang-it"
                        type="text"
                        autocomplete="off"
                        aria-label={`${TENSE_LABEL[tense]} ${PERSON_SHORT[person]} Italiaans`}
                        aria-invalid={Boolean(cellError)}
                        bind:value={draft.forms[tense][person].it}
                      />
                    </td>
                    <td>
                      <input
                        class="text-input"
                        type="text"
                        autocomplete="off"
                        aria-label={`${TENSE_LABEL[tense]} ${PERSON_SHORT[person]} Nederlands`}
                        aria-invalid={Boolean(cellError)}
                        bind:value={draft.forms[tense][person].nl}
                      />
                    </td>
                  </tr>
                  {#if cellError}
                    <tr><td></td><td colspan="2" class="field-error">{cellError}</td></tr>
                  {/if}
                {/each}
              </tbody>
            </table>
          </div>
        </details>
      {/each}
      <div class="field-error" role="alert">{errors.forms ?? ""}</div>
    </div>

    {#each result.warnings as warning (warning)}
      <p class="form-warning" role="status">{warning}</p>
    {/each}
    {#if submitted && !result.value}
      <p class="field-error">Controleer de gemarkeerde velden.</p>
    {/if}

    <button class="btn btn-primary btn-block" type="submit">Opslaan</button>
  </form>
</main>
