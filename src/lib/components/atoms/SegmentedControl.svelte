<script lang="ts">
	import { prefersReducedMotion } from '$lib/motion';
	import { Spring } from 'svelte/motion';
	import { m } from '$lib/paraglide/messages';
	import { CircleQuestionMark } from '@lucide/svelte';
	import type { Preference } from '$lib/types';

	let {
		value = $bindable(),
		choices = ['preferred', 'available', 'unavailable'],
		readOnly = false
	}: {
		value: Preference | undefined;
		// The event's enabled choices, in display order (see $lib/logic/choices).
		choices?: Preference[];
		readOnly?: boolean;
	} = $props();

	// Signature interaction: the thumb springs between the segments. Position is
	// the segment index; we drive translateX as a % of container width so no
	// measuring is needed. da-DK reduced-motion → instant. Unsure is the neutral
	// state: muted ink thumb + question-mark icon (DESIGN.md).
	const META: Record<Preference, { label: () => string; color: string }> = {
		preferred: { label: m.prefPreferred, color: 'var(--color-amber)' },
		available: { label: m.prefAvailable, color: 'var(--color-good)' },
		unavailable: { label: m.prefUnavailable, color: 'var(--color-bad)' },
		unsure: { label: m.prefUnsure, color: 'var(--color-ink-muted)' }
	};
	const options = $derived(
		choices.map((pref) => ({ pref, label: META[pref].label(), color: META[pref].color }))
	);

	const reduced = prefersReducedMotion();

	const activeIndex = $derived(options.findIndex((o) => o.pref === value));
	// Seed the spring once from the initial value; the $effect below tracks it.
	// svelte-ignore state_referenced_locally
	const initialIndex = choices.findIndex((p) => p === value);
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
			style="left:3px; width:calc((100% - 6px) / {options.length}); transform:translateX(calc({pos.current} * 100%)); background:{options[
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
			class="relative z-10 flex flex-1 items-center justify-center gap-1 rounded-control border-none bg-transparent px-1 py-2.75 text-sm font-semibold transition-colors duration-150 {value ===
			opt.pref
				? 'text-white'
				: 'text-ink-muted'} {readOnly ? 'cursor-not-allowed' : 'cursor-pointer'}"
		>
			{#if opt.pref === 'unsure'}<CircleQuestionMark
					size={14}
					class="shrink-0"
					aria-hidden="true"
				/>{/if}
			{opt.label}
		</button>
	{/each}
</div>
