<script lang="ts">
  import AuthForm from "$lib/components/AuthForm.svelte";
  import type { PageProps } from "./$types";

  let { form }: PageProps = $props();
</script>

<svelte:head><title>Account aanmaken · Ripasso</title></svelte:head>

<div class="wrap">
  <AuthForm title="Account aanmaken" submitLabel="Account aanmaken" mode="sign-up" {form} />
</div>
