<script lang="ts">
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages';

	// The three-preference distribution for one date option. Used on the
	// organizer dashboard (with expandable respondent names) and on participant
	// pages after close (counts only - names never leave the dashboard).
	interface Props {
		preferred: number;
		available: number;
		unavailable: number;
		preferredPct: number;
		availablePct: number;
		unavailablePct: number;
		// Dashboard only: who chose what, revealed by the card's expand toggle.
		names?: { preferred: string[]; available: string[]; unavailable: string[] } | null;
		expanded?: boolean;
	}

	let {
		preferred,
		available,
		unavailable,
		preferredPct,
		availablePct,
		unavailablePct,
		names = null,
		expanded = false
	}: Props = $props();

	// Bars grow from 0 to their width once mounted (DESIGN.md: animate width on
	// mount, ~450ms ease-out). Reduced-motion → straight to full width.
	const reduced =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	let revealed = $state(reduced);
	onMount(() => {
		if (!revealed) requestAnimationFrame(() => (revealed = true));
	});

	const bars = $derived([
		{
			label: m.prefPreferred(),
			count: preferred,
			pct: preferredPct,
			color: 'bg-amber',
			names: names?.preferred ?? []
		},
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
		}
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
