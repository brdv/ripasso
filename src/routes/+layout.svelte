<script lang="ts">
  import "../app.css";
  import { page } from "$app/state";
  import NavBar from "$lib/components/NavBar.svelte";

  let { data, children } = $props();

  // A running session gets the whole screen; it has its own "Stoppen" button.
  const showNav = $derived(page.route.id !== "/(app)/sessie");
</script>

{#if showNav}
  <NavBar user={data.user} />
{/if}

{@render children()}
