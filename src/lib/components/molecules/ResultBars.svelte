<script lang="ts">
	import { prefersReducedMotion } from '$lib/motion';
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages';

	// The per-preference distribution for one date option. Used on the
	// organizer dashboard (with expandable respondent names) and on participant
	// pages after close (counts only - names never leave the dashboard). Only
	// the event's enabled choices render: hide preferred via showPreferred,
	// show the unsure bar by passing its count (omitted on the outcome view).
	interface Props {
		preferred: number;
		available: number;
		unavailable: number;
		preferredPct: number;
		availablePct: number;
		unavailablePct: number;
		showPreferred?: boolean;
		unsure?: number;
		unsurePct?: number;
		// Dashboard only: who chose what, revealed by the card's expand toggle.
		names?: {
			preferred: string[];
			available: string[];
			unavailable: string[];
			unsure?: string[];
		} | null;
		expanded?: boolean;
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
		unsurePct = 0,
		names = null,
		expanded = false
	}: Props = $props();

	// Bars grow from 0 to their width once mounted (DESIGN.md: animate width on
	// mount, ~450ms ease-out). Reduced-motion → straight to full width.
	const reduced = prefersReducedMotion();
	let revealed = $state(reduced);
	onMount(() => {
		if (!revealed) requestAnimationFrame(() => (revealed = true));
	});

	const bars = $derived([
		...(showPreferred
			? [
					{
						label: m.prefPreferred(),
						count: preferred,
						pct: preferredPct,
						color: 'bg-amber',
						names: names?.preferred ?? []
					}
				]
			: []),
		{
			label: m.prefAvailable(),
			count: available,
			pct: availablePct,
			color: 'bg-good',
			names: names?.available ?? []
		},
		{
			label: m.prefUnavailable(),
			count: unavailable,
			pct: unavailablePct,
			color: 'bg-bad',
			names: names?.unavailable ?? []
		},
		// The neutral state: muted ink on the shared card-alt track (DESIGN.md).
		...(unsure !== undefined
			? [
					{
						label: m.prefUnsure(),
						count: unsure,
						pct: unsurePct,
						color: 'bg-ink-muted',
						names: names?.unsure ?? []
					}
				]
			: [])
	]);
</script>

<div class="flex flex-col gap-2">
	{#each bars as bar (bar.label)}
		<div class="grid grid-cols-[92px_1fr_22px] items-center gap-2.5">
			<div class="text-xs font-semibold text-ink-muted">{bar.label}</div>
			<div class="h-2.5 overflow-hidden rounded-md bg-card-alt">
				<div
					class="h-full rounded-md {bar.color}"
					style="width:{revealed ? bar.pct : 0}%; transition:{reduced
						? 'none'
						: 'width 450ms cubic-bezier(0.16,1,0.3,1)'};"
				></div>
			</div>
			<div class="text-right text-xs font-bold text-ink">{bar.count}</div>
		</div>
		{#if expanded && bar.names.length > 0}
			<div class="pl-25.5 text-caption text-ink-muted">
				{bar.names.join(', ')}
			</div>
		{/if}
	{/each}
</div>
