<script lang="ts">
	import { fly } from 'svelte/transition';
	import { swapIn } from '$lib/motion';
	import type { Snippet } from 'svelte';
	import type { Locale } from '$lib/types';

	// Live language switch: re-renders every m.*() inside under the picked
	// locale with the DESIGN.md state-swap fade (opacity-only, reduced-motion
	// aware). Wrap any block whose strings should follow a live picker.
	let { locale, children }: { locale: Locale; children: Snippet } = $props();
</script>

{#key locale}
	<div in:fly={swapIn({ y: 0 })}>
		{@render children()}
	</div>
{/key}
