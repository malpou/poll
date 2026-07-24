<script lang="ts">
	import { Coffee } from '@lucide/svelte';
	import Card from './Card.svelte';
	import type { AgreementSignal, Card as TCard } from '$lib/logic/poker';
	import { m } from '$lib/paraglide/messages';

	let {
		signal,
		distribution
	}: {
		signal: AgreementSignal;
		distribution: { card: TCard; count: number }[];
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

	<div class="flex flex-wrap items-end gap-3">
		{#each shown as d (String(d.card))}
			<div class="flex flex-col items-center gap-1">
				<Card card={d.card} size="sm" />
				<span class="text-2xs font-bold text-ink-muted">×{d.count}</span>
			</div>
		{/each}
	</div>
</div>
