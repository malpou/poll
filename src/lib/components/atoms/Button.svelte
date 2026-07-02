<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'primary',
		type = 'button',
		onclick,
		label,
		iconOnly = false,
		disabled = false,
		children
	}: {
		variant?: 'primary' | 'dashed' | 'ghost';
		type?: 'button' | 'submit';
		onclick?: () => void;
		// aria-label, required when iconOnly (the visible text is gone).
		label?: string;
		iconOnly?: boolean;
		disabled?: boolean;
		children: Snippet;
	} = $props();

	const variants = {
		primary: 'h-12.5 px-6 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover',
		dashed:
			'mt-2.5 h-10.5 px-4 rounded-control border border-dashed border-border text-primary font-semibold hover:bg-primary-tint hover:border-primary',
		// Ghost sets its own padding below so an icon-only variant can drop it.
		ghost:
			'h-9 rounded-control border border-border bg-card text-primary text-caption font-semibold hover:bg-primary-tint'
	};

	// Only ghost has the icon-only (square) form; primary/dashed keep their padding.
	const pad = $derived(variant === 'ghost' ? (iconOnly ? 'w-9 px-0' : 'px-3.5') : '');
</script>

<button
	{type}
	{onclick}
	{disabled}
	aria-label={label}
	title={iconOnly ? label : undefined}
	class="inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap text-body transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-35 {variants[
		variant
	]} {pad}"
>
	{@render children()}
</button>
