<script lang="ts">
  import { cardLabel } from "$lib/domain/cards";
  import {
    answerFor,
    answerLanguageFor,
    promptFor,
    promptLanguageFor,
  } from "$lib/domain/presentation";
  import type { SessionItem } from "$lib/domain/types";

  let {
    item,
    index,
    checked,
    onChange,
  }: {
    item: SessionItem;
    index: number;
    checked: boolean;
    onChange: (checked: boolean) => void;
  } = $props();
</script>

<label class="plrow">
  <input
    class="pl-check"
    type="checkbox"
    {checked}
    onchange={(event) => onChange(event.currentTarget.checked)}
  />
  <span class="pl-num">{index + 1}</span>
  <span class="pl-pair">
    <span class="pl-chips">{cardLabel(item.card)}</span>
    <span class="pl-line">
      <span class={promptLanguageFor(item.dir)}>{promptFor(item)}</span>
      <span class="pl-arrow">→</span>
      <span class={answerLanguageFor(item.dir)}>{answerFor(item)}</span>
    </span>
  </span>
  <span class="pl-mark">goed</span>
</label>
