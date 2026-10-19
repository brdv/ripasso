<script lang="ts">
  import { page } from "$app/state";
  import { AppState, setAppState } from "$lib/state/app.svelte";
  import { onMount, untrack } from "svelte";
  import type { LayoutProps } from "./$types";

  let { data, children }: LayoutProps = $props();

  // Entries and user only change when this layout is entered again (after logging in or out),
  // which creates a new state.
  const app = setAppState(untrack(() => new AppState(data.entries, data.user)));

  onMount(() => {
    app.load(window.localStorage);
    const sharedSlug = page.url.searchParams.get("gedeeld");
    if (sharedSlug) app.loadSharedSource(sharedSlug);
  });
</script>

<div class="wrap" data-ready={app.ready}>
  {@render children()}
</div>
