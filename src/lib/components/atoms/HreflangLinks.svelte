<script lang="ts">
	import { page } from '$app/state';
	import { baseLocale, locales } from '$lib/paraglide/runtime';

	// hreflang alternates for the marketing pages: every language version
	// cross-references all five, x-default points at the bare (English) URL.
	// path is the language-less route ('' for the landing page, '/create').
	let { path = '' }: { path?: string } = $props();

	const href = (l: string) =>
		`${page.url.origin}${l === baseLocale ? path || '/' : `/${l}${path}`}`;
</script>

<svelte:head>
	{#each locales as l (l)}
		<link rel="alternate" hreflang={l} href={href(l)} />
	{/each}
	<link rel="alternate" hreflang="x-default" href={href(baseLocale)} />
</svelte:head>
