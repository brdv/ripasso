<script lang="ts">
  import { page } from "$app/state";
</script>

<div class="wrap">
  <header class="masthead">
    <div class="brand">Ripasso<small>Italiaans oefenen</small></div>
  </header>
  <main class="card-pane error-pane">
    <h1>De app kon niet starten</h1>
    <p>{page.error?.message ?? "Er ging iets onverwachts mis."}</p>
    <button class="btn btn-primary" type="button" onclick={() => window.location.reload()}>
      Opnieuw proberen
    </button>
  </main>
</div>
