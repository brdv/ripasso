<script lang="ts">
  import { resolve } from "$app/paths";
  import { enhance } from "$app/forms";
  import { onMount } from "svelte";
  import { MIN_PASSWORD_LENGTH } from "$lib/domain/constants";

  let {
    title,
    submitLabel,
    mode,
    form,
  }: {
    title: string;
    submitLabel: string;
    mode: "sign-in" | "sign-up";
    form: { email?: string; message?: string } | null;
  } = $props();

  let pending = $state(false);
  let ready = $state(false);
  onMount(() => (ready = true));
</script>

<main data-ready={ready}>
  <div class="topbar">
    <a class="btn btn-ghost compact-button" href={resolve("/")}>Terug</a>
    <h1 class="view-title">{title}</h1>
  </div>

  <form
    class="card-pane"
    method="POST"
    novalidate
    use:enhance={() => {
      pending = true;
      return async ({ update }) => {
        await update({ reset: false, invalidateAll: true });
        pending = false;
      };
    }}
  >
    <div class="field">
      <label class="label" for="auth-email">E-mailadres</label>
      <input
        id="auth-email"
        class="text-input"
        name="email"
        type="email"
        autocomplete="email"
        required
        value={form?.email ?? ""}
      />
    </div>
    <div class="field">
      <label class="label" for="auth-password">Wachtwoord</label>
      <input
        id="auth-password"
        class="text-input"
        name="password"
        type="password"
        autocomplete={mode === "sign-up" ? "new-password" : "current-password"}
        minlength={mode === "sign-up" ? MIN_PASSWORD_LENGTH : undefined}
        required
      />
      {#if mode === "sign-up"}
        <div class="list-row-meta">Minstens {MIN_PASSWORD_LENGTH} tekens.</div>
      {/if}
    </div>
    <div class="menu-warning" role="alert">{form?.message ?? ""}</div>
    <button class="btn btn-primary btn-block" type="submit" disabled={pending}>{submitLabel}</button>
    <p class="auth-switch">
      {#if mode === "sign-up"}
        Heb je al een account? <a href={resolve("/inloggen")}>Inloggen</a>
      {:else}
        Nog geen account? <a href={resolve("/account-aanmaken")}>Account aanmaken</a>
      {/if}
    </p>
  </form>
</main>
