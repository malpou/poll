<script lang="ts">
	import './layout.css';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<svelte:head><link rel="icon" href="/favicon.svg" /></svelte:head>
{@render children()}
