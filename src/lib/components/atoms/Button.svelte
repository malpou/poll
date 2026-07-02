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
		// Solid-ink full-width CTA (52px) with a hover lift.
		primary:
			'h-13 w-full px-6 rounded-cta bg-ink text-card font-bold tracking-wider hover:bg-primary-hover hover:-translate-y-0.5',
		dashed:
			'mt-2.5 h-10.5 px-4 rounded-control border-2 border-dashed border-ink-faint text-ink-soft font-bold hover:border-ink hover:text-ink',
		// Ghost inverts to ink fill on hover; sets its own padding below so an
		// icon-only variant can drop it.
		ghost:
			'h-9 rounded-cta border-2 border-ink bg-transparent text-ink text-caption font-bold hover:bg-ink hover:text-card'
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
	class="inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap text-body transition duration-150 disabled:cursor-not-allowed disabled:opacity-35 {variants[
		variant
	]} {pad}"
>
	{@render children()}
</button>
