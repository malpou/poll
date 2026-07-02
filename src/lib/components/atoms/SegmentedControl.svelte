<script lang="ts">
	import { prefersReducedMotion } from '$lib/motion';
	import { Spring } from 'svelte/motion';
	import { m } from '$lib/paraglide/messages';
	import type { Preference } from '$lib/types';

	let {
		value = $bindable(),
		readOnly = false
	}: {
		value: Preference | undefined;
		readOnly?: boolean;
	} = $props();

	// Signature interaction: the thumb springs between the three segments.
	// Position is 0/1/2 (segment index); we drive translateX as a % of container
	// width so no measuring is needed. da-DK reduced-motion → instant.
	const options: { pref: Preference; label: string; color: string }[] = [
		{ pref: 'preferred', label: m.prefPreferred(), color: 'var(--color-amber)' },
		{ pref: 'available', label: m.prefAvailable(), color: 'var(--color-good)' },
		{ pref: 'unavailable', label: m.prefUnavailable(), color: 'var(--color-bad)' }
	];

	const reduced = prefersReducedMotion();

	const activeIndex = $derived(options.findIndex((o) => o.pref === value));
	const initialIndex = options.findIndex((o) => o.pref === value);
	const pos = new Spring(initialIndex < 0 ? 0 : initialIndex, {
		stiffness: 0.42,
		damping: 0.75
	});

	$effect(() => {
		const i = activeIndex < 0 ? 0 : activeIndex;
		if (reduced) void pos.set(i, { instant: true });
		else pos.target = i;
	});

	function select(pref: Preference) {
		if (readOnly) return;
		value = pref;
	}
</script>

<div class="relative flex h-11 w-full rounded-xl bg-card-alt p-0.75">
	{#if activeIndex >= 0}
		<div
			class="pointer-events-none absolute bottom-0.75 top-0.75 rounded-control transition-colors duration-150"
			style="left:3px; width:calc((100% - 6px) / 3); transform:translateX(calc({pos.current} * 100%)); background:{options[
				activeIndex
			].color};"
		></div>
	{/if}
	{#each options as opt (opt.pref)}
		<button
			type="button"
			disabled={readOnly}
			onclick={() => {
				select(opt.pref);
			}}
			aria-pressed={value === opt.pref}
			class="relative z-10 flex-1 rounded-control border-none bg-transparent px-1 py-2.75 text-sm font-semibold transition-colors duration-150 {value ===
			opt.pref
				? 'text-white'
				: 'text-ink-muted'} {readOnly ? 'cursor-not-allowed' : 'cursor-pointer'}"
		>
			{opt.label}
		</button>
	{/each}
</div>
