<script lang="ts">
	import { fly } from 'svelte/transition';
	import { flyIn } from '$lib/motion';

	let { open, text }: { open: boolean; text: string } = $props();
</script>

{#if open}
	<div
		transition:fly={flyIn(0, { y: 16, duration: 200 })}
		class="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-border bg-card px-4.5 py-3.5 shadow-toast"
	>
		<div class="text-sm font-bold text-ink">{text}</div>
	</div>
{/if}
