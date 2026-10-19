<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";

  let { user = null }: { user?: { email: string } | null } = $props();

  const path = $derived(page.url.pathname);
</script>

<header class="navbar">
  <div class="navbar-inner">
    <a class="brand" href={resolve("/")}>Ripasso</a>
    <nav class="nav-links" aria-label="Hoofdmenu">
      <a href={resolve("/")} aria-current={path === "/" ? "page" : undefined}>Oefenen</a>
      <a href={resolve("/lijsten")} aria-current={path.startsWith("/lijsten") ? "page" : undefined}>Lijsten</a>
      <a href={resolve("/woorden")} aria-current={path.startsWith("/woorden") ? "page" : undefined}>Woorden</a>
    </nav>
    <div class="account-bar">
      {#if user}
        <span class="account-email">{user.email}</span>
        <form method="POST" action="/uitloggen">
          <button class="linkbtn" type="submit">Uitloggen</button>
        </form>
      {:else}
        <a class="linkbtn" href={resolve("/inloggen")}>Inloggen</a>
        <a class="btn btn-primary compact-button" href={resolve("/account-aanmaken")}>Account aanmaken</a>
      {/if}
    </div>
  </div>
</header>
