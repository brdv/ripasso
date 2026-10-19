<script lang="ts">
  import { resolve } from "$app/paths";
  import { italianDisplay } from "$lib/domain/cards";
  import {
    GENDER_NL,
    NUMBER_NL,
    PERSON_SHORT,
    PERSONS,
    TENSE_LABEL,
    TENSES,
    WORDTYPE_NL,
  } from "$lib/domain/constants";
  import { entryName } from "$lib/domain/search";
  import type { PracticeList, StudyEntry } from "$lib/domain/types";

  let {
    entry,
    own,
    lists,
    fromList,
    onDelete,
  }: {
    entry: StudyEntry;
    /** Own entries can be edited and deleted; built-in ones cannot. */
    own: boolean;
    /** The user's lists that contain this entry. */
    lists: PracticeList[];
    /** Opened from this list's editor: "Terug" and editing return there. */
    fromList?: string;
    onDelete: () => void;
  } = $props();

  const heading = $derived(
    entry.type === "word" ? italianDisplay({ ...entry, entryId: entry.id }) : entry.lemma,
  );
  const facts = $derived.by(() => {
    const rows: Array<[string, string]> = [];
    if (entry.type === "verb") {
      rows.push(["soort", WORDTYPE_NL.verb]);
      if (entry.auxiliary) rows.push(["hulpwerkwoord", entry.auxiliary]);
      if (entry.conjugationClass) rows.push(["groep", entry.conjugationClass]);
      if (entry.regularity) rows.push(["regelmaat", entry.regularity]);
    } else {
      rows.push(["soort", WORDTYPE_NL[entry.wordType ?? ""] ?? "woord"]);
      if (entry.article) rows.push(["lidwoord", entry.article]);
      if (entry.gender) rows.push(["geslacht", GENDER_NL[entry.gender] ?? entry.gender]);
      if (entry.number) rows.push(["getal", NUMBER_NL[entry.number] ?? entry.number]);
    }
    return rows;
  });
  const tenses = $derived(entry.type === "verb" ? TENSES.filter((tense) => entry.forms?.[tense]) : []);

  function remove() {
    if (window.confirm(`"${entryName(entry)}" verwijderen? Lijsten waarin het staat blijven werken.`)) onDelete();
  }
</script>

<main>
  <div class="topbar">
    <a class="btn btn-ghost compact-button" href={fromList ? resolve("/(app)/lijsten/[id]", { id: fromList }) : resolve("/woorden")}
      >Terug</a
    >
    <h1 class="view-title lang-it">{heading}</h1>
  </div>

  <section class="card-pane">
    <p class="detail-translation">{entry.nl}</p>
    <dl class="hint-dl">
      {#each facts as [term, description] (term)}
        <dt>{term}</dt>
        <dd>{description}</dd>
      {/each}
      <dt>lijsten</dt>
      <dd>
        {#each lists as list, index (list.id)}
          {index > 0 ? ", " : ""}<a href={resolve("/(app)/lijsten/[id]", { id: list.id })}>{list.name}</a>
        {:else}
          nog in geen enkele lijst
        {/each}
      </dd>
    </dl>
    {#if entry.type === "verb" && entry.note}
      <p class="hint-note">{entry.note}</p>
    {/if}

    <div class="detail-actions">
      {#if own}
        <a
          class="btn btn-ghost compact-button"
          href={resolve(
            `/woorden/${encodeURIComponent(entry.id)}/bewerken${fromList ? `?lijst=${encodeURIComponent(fromList)}` : ""}`,
          )}>Bewerken</a
        >
        <button class="linkbtn" type="button" onclick={remove}>Verwijderen</button>
      {:else}
        <p class="pl-intro">Dit woord hoort bij de vaste woordenlijst en kan niet bewerkt worden.</p>
      {/if}
    </div>
  </section>

  {#if entry.type === "verb"}
    <div class="conjugations">
      {#each tenses as tense (tense)}
        <section class="card-pane tense-card">
          <h2 class="tense-title">{TENSE_LABEL[tense]}</h2>
          <table class="conj-table">
            <tbody>
              {#each PERSONS as person (person)}
                {@const form = entry.forms?.[tense]?.[person]}
                {#if form}
                  <tr>
                    <th scope="row">{PERSON_SHORT[person]}</th>
                    <td class="lang-it">{form.it}</td>
                    <td>{form.nl}</td>
                  </tr>
                {/if}
              {/each}
            </tbody>
          </table>
        </section>
      {:else}
        <p class="pl-intro">Dit werkwoord heeft nog geen vervoegingen.</p>
      {/each}
    </div>
  {/if}
</main>
