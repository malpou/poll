<script lang="ts">
	import { page } from '$app/state';
	import LinkNotFound from '$lib/components/molecules/LinkNotFound.svelte';
	import { m } from '$lib/paraglide/messages';
</script>

<svelte:head>
	<title>{page.status === 404 ? m.linkNotFound() : page.status} · {m.appName()}</title>
</svelte:head>

{#if page.status === 404}
	<!-- Capability-URL app: a URL that resolves to nothing is a bad link. -->
	<LinkNotFound />
{:else}
	<div class="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-10 text-center">
		<div class="h-13 w-13 rotate-45 rounded-cta border-2 border-border-strong bg-card-alt"></div>
		<h1 class="mt-3 text-2xl font-bold text-ink"><span class="hl-swipe">{page.status}</span></h1>
	</div>
{/if}
