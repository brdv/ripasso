<script lang="ts">
  import { conjugate } from "$lib/domain/conjugation";
  import { PERSON_SHORT, PERSONS } from "$lib/domain/constants";
  import { irregularExamples, TENSE_THEORY } from "$lib/domain/tense-theory";
  import type { Tense } from "$lib/domain/types";

  let { tense }: { tense: Tense } = $props();

  const theory = $derived(TENSE_THEORY[tense]);
  const irregulars = $derived(irregularExamples(theory.irregular));
</script>

<details class="theory">
  <summary>Hoe vorm je deze tijd?</summary>
  <div class="theory-body">
    <p>{theory.use}</p>
    <p>{theory.dutch}</p>

    <h3 class="theory-heading">Zo bouw je hem</h3>
    <ol class="theory-list">
      {#each theory.steps as step (step)}
        <li>{step}</li>
      {/each}
    </ol>

    <div class="grid-scroll">
      <table class="form-table theory-table">
        <thead>
          <tr>
            <th scope="col"></th>
            {#each theory.models as model (model.lemma)}
              <th scope="col" class="lang-it">{model.lemma}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each PERSONS as person (person)}
            <tr>
              <th scope="row">{PERSON_SHORT[person]}</th>
              {#each theory.models as model (model.lemma)}
                <td class="lang-it">
                  {#each conjugate(model.lemma, tense, person, model) ?? [] as segment, index (index)}
                    {#if segment.ending}<b class="theory-ending">{segment.text}</b>{:else}{segment.text}{/if}
                  {/each}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <ul class="theory-list">
      {#each theory.notes as note (note)}
        <li>{note}</li>
      {/each}
    </ul>

    {#if irregulars.length > 0}
      <h3 class="theory-heading">Onregelmatig</h3>
      <dl class="hint-dl">
        {#each irregulars as example (example.lemma)}
          <dt class="lang-it">{example.lemma}</dt>
          <dd class="lang-it">
            {#each example.forms as form, index (index)}
              {index > 0 ? ", " : ""}{#if form.irregular}<b>{form.text}</b>{:else}{form.text}{/if}
            {/each}
          </dd>
        {/each}
      </dl>
    {/if}

    <h3 class="theory-heading">Signaalwoorden</h3>
    <dl class="hint-dl">
      {#each theory.signalWords as [italian, dutch] (italian)}
        <dt class="lang-it">{italian}</dt>
        <dd>{dutch}</dd>
      {/each}
    </dl>
  </div>
</details>
