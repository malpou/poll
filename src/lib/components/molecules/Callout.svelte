<script lang="ts">
	import type { Snippet } from 'svelte';

	// Highlighted box with an optional icon+title row: share links, warnings,
	// chosen dates, edit links. One look for every callout on the site.
	let {
		tone = 'neutral',
		title,
		icon,
		children,
		class: cls = ''
	}: {
		tone?: 'ink' | 'hl' | 'neutral' | 'dashed';
		title?: string;
		icon?: Snippet;
		children: Snippet;
		class?: string;
	} = $props();

	const tones = {
		ink: { box: 'border-ink bg-card-alt', title: 'text-ink' },
		hl: { box: 'border-ink bg-hl-tint', title: 'text-ink' },
		neutral: { box: 'border-border bg-card-alt', title: 'text-ink' },
		// Attention without alarm - the chase-up list.
		dashed: { box: 'border-dashed border-ink-faint bg-transparent', title: 'text-ink' }
	};
</script>

<!-- data-tone is the stable hook for tests - never target the tint classes. -->
<div data-tone={tone} class="rounded-card border-2 px-4 py-3.5 {tones[tone].box} {cls}">
	{#if title}
		<div class="flex items-center gap-2 text-sm font-bold {tones[tone].title}">
			{#if icon}{@render icon()}{/if}
			{title}
		</div>
	{/if}
	{@render children()}
</div>
