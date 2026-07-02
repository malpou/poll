<script lang="ts">
	import { prefersReducedMotion } from '$lib/motion';
	import { onMount } from 'svelte';
	import { Check, CircleQuestionMark, Star, X } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';

	// One option's result, per DESIGN.md: an icon count per enabled choice, a
	// single stacked bar (preferred + available fill; the rest stays track), and
	// - on the organizer dashboard - every respondent's name as a pill marked
	// with their answer. Participant-facing outcome views pass no names.
	interface Props {
		preferred: number;
		available: number;
		unavailable: number;
		preferredPct: number;
		availablePct: number;
		unavailablePct: number;
		showPreferred?: boolean;
		unsure?: number;
		names?: {
			preferred: string[];
			available: string[];
			unavailable: string[];
			unsure?: string[];
		} | null;
	}

	let {
		preferred,
		available,
		unavailable,
		preferredPct,
		availablePct,
		unavailablePct,
		showPreferred = true,
		unsure = undefined,
		names = null
	}: Props = $props();

	// The bar grows from 0 once mounted (DESIGN.md: ~450ms ease-out, scaleX).
	// Reduced-motion → straight to full width.
	const reduced = prefersReducedMotion();
	let revealed = $state(reduced);
	onMount(() => {
		if (!revealed) requestAnimationFrame(() => (revealed = true));
	});

	const counts = $derived([
		...(showPreferred ? [{ icon: Star, label: m.prefPreferred(), count: preferred }] : []),
		{ icon: Check, label: m.prefAvailable(), count: available },
		{ icon: X, label: m.prefUnavailable(), count: unavailable },
		...(unsure !== undefined
			? [{ icon: CircleQuestionMark, label: m.prefUnsure(), count: unsure }]
			: [])
	]);

	// Name pills, grouped positive-first. Each pill carries its answer's mark;
	// unavailable names strike through, per DESIGN.md.
	const marks = $derived(
		names
			? [
					...names.preferred.map((name) => ({ name, pref: 'preferred' as const })),
					...names.available.map((name) => ({ name, pref: 'available' as const })),
					...(names.unsure ?? []).map((name) => ({ name, pref: 'unsure' as const })),
					...names.unavailable.map((name) => ({ name, pref: 'unavailable' as const }))
				]
			: []
	);
</script>

<div class="flex flex-col gap-2.5">
	<div class="flex flex-wrap gap-x-3.5 gap-y-0.5 text-caption text-ink-muted">
		{#each counts as c (c.label)}
			<span class="inline-flex items-center gap-1">
				<c.icon size={12} class="shrink-0" aria-hidden="true" />
				{c.count}
				{c.label}
			</span>
		{/each}
	</div>

	<div class="h-2.5 overflow-hidden rounded-full bg-wash">
		<div
			class="flex h-full origin-left"
			style="transform:scaleX({revealed ? 1 : 0}); transition:{reduced
				? 'none'
				: 'transform 450ms cubic-bezier(0,0,.2,1)'};"
		>
			{#if showPreferred}
				<div class="h-full bg-hl" style="width:{preferredPct}%"></div>
				<div class="h-full bg-border-strong" style="width:{availablePct}%"></div>
			{:else}
				<!-- Without a Preferred choice, Available is the positive answer and
				     takes the highlighter fill. -->
				<div class="h-full bg-hl" style="width:{availablePct}%"></div>
			{/if}
			<!-- Unavailable renders as the ink hatch (same mark as the selector's
			     "no" face) so it never reads as "hasn't answered" - only unsure and
			     not-yet-answered stay plain track. -->
			<div class="ink-hatch h-full" style="width:{unavailablePct}%"></div>
		</div>
	</div>

	{#if marks.length > 0}
		<div class="flex flex-wrap gap-1.5">
			{#each marks as mk (mk.pref + mk.name)}
				<span
					class="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs {mk.pref ===
					'preferred'
						? 'bg-hl font-bold text-ink'
						: mk.pref === 'unavailable'
							? 'border border-border-strong text-ink-muted line-through'
							: 'border border-border-strong text-ink'}"
				>
					{mk.name}
					{#if mk.pref === 'preferred'}
						<Star size={11} fill="currentColor" aria-hidden="true" />
					{:else if mk.pref === 'available'}
						<Check size={11} aria-hidden="true" />
					{:else if mk.pref === 'unsure'}
						<CircleQuestionMark size={11} aria-hidden="true" />
					{:else}
						<X size={11} aria-hidden="true" />
					{/if}
				</span>
			{/each}
		</div>
	{/if}
</div>
