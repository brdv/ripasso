<script lang="ts">
  import { TENSE_LABEL, TENSES } from "$lib/domain/constants";
  import type { MenuState } from "$lib/domain/types";

  let {
    menu = $bindable(),
    warning = "",
    resetNote = "",
    onStart,
    onReset,
  }: {
    menu: MenuState;
    warning?: string;
    resetNote?: string;
    onStart: () => void;
    onReset: () => void;
  } = $props();
</script>

<main>
  <div class="card-pane">
    <div class="field">
      <div class="label">Richting</div>
      <div class="seg-group seg-group--3">
        <label class="seg">
          <input type="radio" name="dir" value="nl_it" bind:group={menu.dir} />
          <span>Nederlands → Italiaans</span>
        </label>
        <label class="seg">
          <input type="radio" name="dir" value="it_nl" bind:group={menu.dir} />
          <span>Italiaans → Nederlands</span>
        </label>
        <label class="seg">
          <input type="radio" name="dir" value="mix" bind:group={menu.dir} />
          <span>Door elkaar</span>
        </label>
      </div>
    </div>

    <div class="field">
      <div class="label">Wat oefenen</div>
      <div class="check-group content-options">
        <label class="chk">
          <input type="checkbox" bind:checked={menu.includeVerbs} />
          <span>Werkwoorden</span>
        </label>
        <label class="chk">
          <input type="checkbox" bind:checked={menu.includeWords} />
          <span>Woorden</span>
        </label>
      </div>
      <div class="check-group" class:is-disabled={!menu.includeVerbs}>
        {#each TENSES as tense}
          <label class="chk">
            <input type="checkbox" bind:checked={menu.tenses[tense]} disabled={!menu.includeVerbs} />
            <span>{TENSE_LABEL[tense]}</span>
          </label>
        {/each}
      </div>
    </div>

    <div class="field">
      <div class="label">Sessie</div>
      <div class="seg-group session-options">
        <label class="seg">
          <input type="radio" name="session-type" value="smart" bind:group={menu.sessionType} />
          <span>Slimme review</span>
        </label>
        <label class="seg">
          <input type="radio" name="session-type" value="free" bind:group={menu.sessionType} />
          <span>Vrije sessie</span>
        </label>
      </div>
      <div class="count-row">
        <input id="session-count" type="number" min="1" max="200" inputmode="numeric" bind:value={menu.count} />
        <label class="hint-inline" for="session-count">aantal kaarten per sessie</label>
      </div>
    </div>

    <div class="field">
      <div class="label">Nakijken</div>
      <div class="seg-group">
        <label class="seg">
          <input type="radio" name="flow" value="direct" bind:group={menu.flow} />
          <span>Direct per kaart</span>
        </label>
        <label class="seg">
          <input type="radio" name="flow" value="paper" bind:group={menu.flow} />
          <span>Achteraf op papier</span>
        </label>
      </div>
    </div>
  </div>

  <div class="start-wrap">
    <button class="btn btn-primary btn-block" type="button" onclick={onStart}>Start sessie</button>
    <div class="menu-warning" role="status">{warning}</div>
  </div>

  <div class="reset-row">
    <button class="linkbtn" type="button" onclick={onReset}>Voortgang wissen</button>
    <span class="reset-note" role="status">{resetNote}</span>
  </div>
</main>
