<script lang="ts">
	import ResultBars from './ResultBars.svelte';
	import ValueResult from './ValueResult.svelte';
	import { Star } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import { isTextPollType, type PollType } from '$lib/types';
	import type { Snippet } from 'svelte';

	// One option's result card (DESIGN.md "Result cards"), shared by the
	// organizer results view and the participant outcome view so the two render
	// identically and can't drift. Names, the best badge, and the leading
	// selection checkbox are organizer-only extras; participant views omit them.
	let {
		weekday,
		dateLabel,
		timeRange,
		label,
		chosen,
		best = false,
		highlighted = false,
		pollType = 'dates',
		preferred,
		available,
		unavailable,
		preferredPct,
		availablePct,
		unavailablePct,
		showPreferred = true,
		unsure = undefined,
		names = null,
		value = null,
		leading = undefined
	}: {
		weekday: string;
		dateLabel: string;
		timeRange: string;
		label: string;
		chosen: boolean;
		best?: boolean;
		highlighted?: boolean;
		pollType?: PollType;
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
		// Rank/highlight summary; when set it replaces the preference bars.
		value?: {
			kind: 'rank' | 'highlight';
			avgPosition?: number | null;
			valueSum: number;
			sharePct?: number;
			names?: { name: string; value: number }[];
		} | null;
		leading?: Snippet;
	} = $props();

	// Text-option polls (question, rank, highlight) share the option wording.
	const question = $derived(isTextPollType(pollType));
</script>

<div
	class="rounded-card border-2 bg-card-alt p-4 transition-colors duration-150 {highlighted ||
	chosen ||
	best
		? 'border-ink'
		: 'border-border'}"
>
	<div class="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
		{#if leading}{@render leading()}{/if}
		{#if label}
			<span class="text-lead font-bold text-ink">{label}</span>
		{:else}
			<span class="text-lead font-bold capitalize text-ink">{weekday}</span>
			<span class="text-body text-ink-soft">{dateLabel}</span>
			{#if timeRange}
				<span class="text-caption text-ink-muted">{timeRange}</span>
			{/if}
		{/if}
		{#if chosen}
			<span
				class="ml-auto whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-card"
			>
				{question ? m.chosenBadgeQuestion() : m.chosenBadge()}
			</span>
		{:else if best}
			<span
				class="ml-auto inline-flex -rotate-1 items-center gap-1 whitespace-nowrap rounded-full bg-hl px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-ink"
			>
				<Star size={11} fill="currentColor" aria-hidden="true" />
				{question ? m.bestOption() : m.bestDate()}
			</span>
		{/if}
	</div>

	<div class="mt-3">
		{#if value}
			<ValueResult
				kind={value.kind}
				avgPosition={value.avgPosition ?? null}
				valueSum={value.valueSum}
				sharePct={value.sharePct ?? 0}
				names={value.names ?? []}
			/>
		{:else}
			<ResultBars
				{preferred}
				{available}
				{unavailable}
				{preferredPct}
				{availablePct}
				{unavailablePct}
				{showPreferred}
				{unsure}
				{pollType}
				{names}
			/>
		{/if}
	</div>
</div>
