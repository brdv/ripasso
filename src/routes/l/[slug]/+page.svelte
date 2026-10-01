<script lang="ts">
  import { resolve } from "$app/paths";
  import { formatListCounts, listCounts } from "$lib/domain/lists";
  import { onMount } from "svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  // The main page reads `?gedeeld=` when it mounts.
  const practiseUrl = $derived(`${resolve("/")}?gedeeld=${encodeURIComponent(data.slug)}`);
  const counts = $derived(formatListCounts(listCounts(data.list, data.entries)));
  let ready = $state(false);
  let copying = $state(false);
  let message = $state("");

  onMount(() => (ready = true));

  async function copy() {
    copying = true;
    message = "";
    const response = await fetch(`/api/shared/${encodeURIComponent(data.slug)}/copy`, { method: "POST" });
    copying = false;
    if (response.ok) {
      message = "Gekopieerd naar je lijsten.";
    } else {
      message = "Kopiëren lukte niet. Probeer het opnieuw.";
    }
  }
</script>

<svelte:head><title>{data.list.name} · Ripasso</title></svelte:head>

<div class="wrap" data-ready={ready}>
  <main>
    <div class="topbar">
      <a class="btn btn-ghost compact-button" href={resolve("/")}>Ripasso</a>
      <h1 class="view-title">Gedeelde lijst</h1>
    </div>

    <section class="card-pane">
      <div class="shared-name lang-it">{data.list.name}</div>
      <div class="list-row-meta">{counts}</div>

      <div class="start-wrap">
        <!-- The URL is built from resolve("/") plus a query string, which the rule cannot see. -->
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
        <a class="btn btn-primary btn-block" href={practiseUrl}>Oefen deze lijst</a>
      </div>

      {#if data.user && !data.isOwner}
        <div class="start-wrap">
          <button class="btn btn-ghost btn-block" type="button" onclick={copy} disabled={copying}>
            Kopieer naar mijn lijsten
          </button>
        </div>
      {:else if !data.user}
        <p class="auth-switch">
          <a href={resolve("/inloggen")}>Log in</a> om deze lijst naar je eigen lijsten te kopiëren.
        </p>
      {/if}
      <div class="reset-note" role="status">{message}</div>
    </section>
  </main>
</div>
