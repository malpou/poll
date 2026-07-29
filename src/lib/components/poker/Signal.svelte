<script lang="ts">
	import { ChevronDown, Coffee } from '@lucide/svelte';
	import Card from './Card.svelte';
	import type { AgreementSignal, Card as TCard } from '$lib/logic/poker';
	import { m } from '$lib/paraglide/messages';

	let {
		signal,
		distribution,
		voters = []
	}: {
		signal: AgreementSignal;
		distribution: { card: TCard; count: number }[];
		// Who cast what, for the per-card disclosure. Empty = counts only.
		voters?: { name: string; card: TCard }[];
	} = $props();

	// agree = highlighter tint, close = neutral, spread = the "no" (bad) tone.
	const tone = $derived(
		signal.level === 'agree'
			? { box: 'border-border bg-hl-tint text-ink', dot: 'bg-hl' }
			: signal.level === 'close'
				? { box: 'border-border-strong bg-card-alt text-ink', dot: 'bg-ink' }
				: { box: 'border-border-strong bg-bad-tint text-ink', dot: 'bg-bad' }
	);
	const label = $derived(
		signal.level === 'agree'
			? m.pokerSignalAgree()
			: signal.level === 'close'
				? m.pokerSignalClose()
				: m.pokerSignalSpread()
	);
	const shown = $derived(distribution.filter((d) => d.count > 0));
	// Names per card, alphabetical like the roster.
	const namesFor = (card: TCard) =>
		voters
			.filter((v) => v.card === card)
			.map((v) => v.name)
			.sort((a, b) => a.localeCompare(b));
</script>

<div class="flex flex-col gap-3">
	<div
		class="flex items-center gap-2.5 rounded-card border-2 px-4 py-3 text-sm font-semibold {tone.box}"
	>
		<span class="h-2 w-2 shrink-0 rounded-full {tone.dot}" aria-hidden="true"></span>
		<span>{label}</span>
		{#if signal.suggestion !== null}
			<span class="ml-auto font-bold">{m.pokerSuggested({ value: signal.suggestion })}</span>
		{/if}
	</div>

	{#if signal.needsBreak}
		<div class="flex items-center gap-2 text-caption text-ink-muted">
			<Coffee size={14} />
			<span>{m.pokerBreakHint()}</span>
		</div>
	{/if}

	<!-- Each stack opens to name who played it. Native <details>: no JS, works on
	     touch and keyboard, and collapses back to plain counts when no names are
	     known (the landing example passes them, a live reveal always has them). -->
	<div class="flex flex-wrap items-start gap-3" data-testid="poker-distribution">
		{#each shown as d (String(d.card))}
			{@const names = namesFor(d.card)}
			<details class="group" open={false}>
				<summary
					class="flex list-none flex-col items-center gap-1 [&::-webkit-details-marker]:hidden"
					class:cursor-pointer={names.length > 0}
				>
					<Card card={d.card} size="sm" />
					<span class="flex items-center gap-0.5 text-2xs font-bold text-ink-muted">
						×{d.count}
						{#if names.length}<ChevronDown
								size={12}
								class="transition group-open:rotate-180"
								aria-hidden="true"
							/>{/if}
					</span>
				</summary>
				<ul class="mt-1 flex max-w-24 flex-col items-center gap-0.5">
					{#each names as name (name)}
						<li class="max-w-full truncate text-2xs text-ink-soft">{name}</li>
					{/each}
				</ul>
			</details>
		{/each}
	</div>
</div>
