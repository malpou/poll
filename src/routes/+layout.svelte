<script lang="ts">
	import './layout.css';
	import { browser } from '$app/environment';
	import { overwriteGetLocale, baseLocale, isLocale } from '$lib/paraglide/runtime';
	import type { Snippet } from 'svelte';

	// Locale is per-poll and stamped into <html lang> by the server (hooks.server).
	// On the client there is no request ALS, so mirror it from the DOM instead -
	// otherwise hydration would re-render every m.*() in baseLocale (da).
	if (browser) {
		overwriteGetLocale(() => {
			const lang = document.documentElement.lang;
			return isLocale(lang) ? lang : baseLocale;
		});
	}

	let { children }: { children: Snippet } = $props();
</script>

<svelte:head><link rel="icon" href="/favicon.svg" /></svelte:head>
{@render children()}
