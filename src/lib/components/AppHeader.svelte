<script lang="ts">
  import { resolve } from "$app/paths";
  let { summary, user = null }: { summary: string; user?: { email: string } | null } = $props();
</script>

<header class="masthead">
  <div class="brand">Ripasso<small>Italiaans oefenen</small></div>
  <div class="data-summary">{summary}</div>
</header>
<div class="account-bar">
  {#if user}
    <span class="account-email">{user.email}</span>
    <form method="POST" action="/uitloggen">
      <button class="linkbtn" type="submit">Uitloggen</button>
    </form>
  {:else}
    <a class="linkbtn" href={resolve("/inloggen")}>Inloggen</a>
    <a class="linkbtn" href={resolve("/account-aanmaken")}>Account aanmaken</a>
  {/if}
</div>
