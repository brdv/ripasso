<script lang="ts">
  let { summary }: { summary: string } = $props();
</script>

<header class="masthead">
  <div class="brand">Ripasso<small>Italiaans oefenen</small></div>
  <div class="data-summary">{summary}</div>
</header>
