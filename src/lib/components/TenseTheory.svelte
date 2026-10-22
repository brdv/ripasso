<script lang="ts">
  import RichText from "$lib/components/RichText.svelte";
  import { conjugate, shortAgreement, type FormSegment } from "$lib/domain/conjugation";
  import { PERSON_SHORT, PERSONS, TENSE_LABEL } from "$lib/domain/constants";
  import { irregularRows, modelLabel, TENSE_THEORY } from "$lib/domain/tense-theory";
  import type { Tense } from "$lib/domain/types";

  let { tense }: { tense: Tense } = $props();

  let dialog: HTMLDialogElement;
  const theory = $derived(TENSE_THEORY[tense]);
  const irregular = $derived(theory.irregular);
  const rows = $derived(irregularRows(irregular, tense));
  const title = $derived(TENSE_LABEL[tense].charAt(0).toUpperCase() + TENSE_LABEL[tense].slice(1));
  const titleId = $derived(`theory-title-${tense}`);

  const CHIP: Record<NonNullable<FormSegment["kind"]>, string> = {
    ending: "theory-chip theory-chip-ending",
    infix: "theory-chip theory-chip-change",
    irregular: "theory-chip theory-chip-irregular",
    auxiliary: "theory-aux",
  };

  function closeOnBackdrop(event: MouseEvent) {
    // A click on the dialog element itself, not on its content, is a click on the backdrop.
    if (event.target === dialog) dialog.close();
  }

  const isRegular = (segments: FormSegment[]) => !segments.some((segment) => segment.kind === "irregular");
</script>

<!-- Endings are only marked in the model tables; in the irregular sections only the irregular parts are. -->
{#snippet form(segments: FormSegment[], marked: Array<FormSegment["kind"]>)}
  {#each segments as segment, index (index)}
    {#if segment.kind && marked.includes(segment.kind)}<span class={CHIP[segment.kind]}>{segment.text}</span
      >{:else}{segment.text}{/if}
  {/each}
{/snippet}

<button class="linkbtn theory-open" type="button" onclick={() => dialog.showModal()}>Hoe vorm je deze tijd?</button>

<dialog bind:this={dialog} class="theory" aria-labelledby={titleId} onclick={closeOnBackdrop}>
  <div class="theory-header">
    <div class="theory-heading-group">
      <h2 id={titleId} class="theory-title">{title}</h2>
      <p class="theory-tagline">{theory.tagline}</p>
    </div>
    <button class="btn btn-ghost compact-button" type="button" onclick={() => dialog.close()}>Sluiten</button>
  </div>

  <div class="theory-body">
    <p><RichText text={theory.intro} /></p>

    <section class="theory-section">
      <h3 class="theory-section-title">{theory.regular.heading}</h3>
      <p><RichText text={theory.regular.instruction} /></p>
      <p class="theory-legend">
        {#each theory.regular.legend as item (item)}
          <span><RichText text={item} /></span>
        {/each}
      </p>

      <div class="theory-scroll">
        <table class="theory-table">
          <thead>
            <tr>
              <th scope="col"></th>
              {#each theory.regular.models as model (model.lemma)}
                <th scope="col">
                  <span class="lang-it">{model.lemma}</span>
                  <!-- Non-breaking hyphens, so a narrow column wraps "-ire met -isc-" only at its spaces. -->
                  <span class="theory-col-label">{modelLabel(model, tense).replaceAll("-", "\u2011")}</span>
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each PERSONS as person (person)}
              <tr class:theory-highlight={theory.regular.highlight === person}>
                <th scope="row">{PERSON_SHORT[person]}</th>
                {#each theory.regular.models as model (model.lemma)}
                  <td class="lang-it">
                    {@render form(shortAgreement(conjugate(model.lemma, tense, person, model) ?? []), [
                      "ending",
                      "infix",
                      "auxiliary",
                    ])}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <ul class="theory-notes">
        {#each theory.regular.notes as note (note)}
          <li><RichText text={note} /></li>
        {/each}
      </ul>
    </section>

    <section class="theory-section">
      <h3 class="theory-section-title">{irregular.heading}</h3>
      <p><RichText text={irregular.intro} /></p>
      <div class="theory-card">
        <table class="theory-grid">
          <thead>
            <tr>
              <th scope="col">werkwoord</th>
              {#if irregular.shape === "grid"}
                {#each PERSONS as person (person)}
                  <th scope="col">{PERSON_SHORT[person]}</th>
                {/each}
              {:else}
                <th scope="col">{irregular.kind === "participle" ? "deelwoord" : "stam"}</th>
                {#if irregular.kind === "futureStem"}<th scope="col">io</th>{/if}
              {/if}
            </tr>
          </thead>
          <tbody>
            {#each rows as row (row.lemma)}
              <tr>
                <th scope="row" class="lang-it">{row.lemma}</th>
                {#if row.piece}
                  <td class="lang-it"><span class="theory-chip theory-chip-irregular">{row.piece}</span></td>
                {/if}
                {#each row.forms as segments, index (index)}
                  <td class="lang-it" class:theory-regular={isRegular(segments)}>
                    {@render form(segments, ["irregular"])}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      {#if irregular.shape === "grid"}
        <p class="theory-legend">
          {#each irregular.legend as item (item)}
            <span><RichText text={item} /></span>
          {/each}
        </p>
      {/if}
    </section>

    <section class="theory-section">
      <h3 class="theory-section-title">Signaalwoorden</h3>
      <dl class="theory-signals">
        {#each theory.signalWords as [italian, dutch] (italian)}
          <dt class="lang-it">{italian}</dt>
          <dd>{dutch}</dd>
        {/each}
      </dl>
    </section>
  </div>
</dialog>
