<script lang="ts">
  import AuthForm from "$lib/components/AuthForm.svelte";
  import type { PageProps } from "./$types";

  let { form }: PageProps = $props();
</script>

<svelte:head><title>Inloggen · Ripasso</title></svelte:head>

<div class="wrap">
  <AuthForm title="Inloggen" submitLabel="Inloggen" mode="sign-in" {form} />
</div>
