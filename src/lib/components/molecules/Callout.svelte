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
		tone?: 'primary' | 'amber' | 'neutral';
		title?: string;
		icon?: Snippet;
		children: Snippet;
		class?: string;
	} = $props();

	const tones = {
		primary: { box: 'border-primary bg-primary-tint', title: 'text-primary' },
		amber: { box: 'border-amber bg-amber-tint', title: 'text-amber' },
		neutral: { box: 'border-border bg-card-alt', title: 'text-ink' }
	};
</script>

<div class="rounded-xl border px-4 py-3.5 {tones[tone].box} {cls}">
	{#if title}
		<div class="flex items-center gap-2 text-sm font-bold {tones[tone].title}">
			{#if icon}{@render icon()}{/if}
			{title}
		</div>
	{/if}
	{@render children()}
</div>
