<script lang="ts">
	import { fly } from 'svelte/transition';
	import { flyIn } from '$lib/motion';
	import Callout from '$lib/components/molecules/Callout.svelte';
	import HeadcountCard from '$lib/components/molecules/HeadcountCard.svelte';
	import ResultCard from '$lib/components/molecules/ResultCard.svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import { CalendarCheck, CircleCheck } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import {
		isTextPollType,
		type PollType,
		type Preference,
		type ResponseDateView
	} from '$lib/types';
	import type { OutcomeRow } from '$lib/logic/results';

	// What a participant sees once the poll is decided or cancelled: the
	// organizer's call, then the same result cards the organizer sees - same
	// enabled-choice counts, bar fills, and rank order - with counts only;
	// names stay with the organizer.
	let {
		cancelled,
		dates,
		outcome,
		choices,
		pollType = 'dates'
	}: {
		cancelled: boolean;
		dates: ResponseDateView[];
		// Rank-ordered by the organizer's scoring; null before a decision exists.
		outcome: OutcomeRow[] | null;
		// The event's enabled choices - Preferred / unsure rows follow them.
		choices: Preference[];
		pollType?: PollType;
	} = $props();

	const question = $derived(isTextPollType(pollType));
	const rsvp = $derived(pollType === 'rsvp');
	// Rank/highlight cards show value summaries instead of preference bars;
	// participants see the same cards as the organizer, minus names.
	const valueKind = $derived(pollType === 'rank' || pollType === 'highlight' ? pollType : null);
	const outcomeById = $derived(new Map((outcome ?? []).map((o) => [o.id, o])));
	const dateById = $derived(new Map(dates.map((d) => [d.id, d])));
	const showPreferred = $derived(choices.includes('preferred'));
	const showUnsure = $derived(choices.includes('unsure'));
	const chosenDates = $derived(dates.filter((d) => outcomeById.get(d.id)?.chosen));
	const chosenHeading = $derived(
		rsvp
			? m.confirmedHeadingRsvp()
			: question
				? chosenDates.length > 1
					? m.chosenOptionsHeading()
					: m.chosenOptionHeading()
				: chosenDates.length > 1
					? m.chosenDatesHeading()
					: m.chosenDateHeading()
	);
	// Confirmed RSVP: the final headcount, counts only - names stay with the
	// organizer (openspec/specs/rsvp-poll).
	const rsvpOutcome = $derived(rsvp ? outcomeById.get(dates[0]?.id) : undefined);
</script>

{#if cancelled}
	<!-- No decision, no distribution - just the organizer's call, spelled out. -->
	<Callout>
		<p class="text-body leading-relaxed text-ink-muted">
			{rsvp
				? m.cancelledMessageRsvp()
				: question
					? m.cancelledMessageQuestion()
					: m.cancelledMessage()}
		</p>
	</Callout>
{:else}
	<!-- The outcome, front and center: the chosen option(s)... -->
	<div in:fly={flyIn()}>
		<Callout tone="ink" title={chosenHeading}>
			{#snippet icon()}{#if question}<CircleCheck size={16} class="shrink-0" />{:else}<CalendarCheck
						size={16}
						class="shrink-0"
					/>{/if}{/snippet}
			<div class="mt-1.5 flex flex-col gap-1">
				{#each chosenDates as d (d.id)}
					{#if d.label}
						<div class="text-xl font-bold text-ink">{d.label}</div>
					{:else}
						<div class="text-xl font-bold capitalize text-ink">
							{d.weekday}
							{d.dateLabel}{#if d.timeRange}
								<span class="text-base font-semibold text-ink-muted">· {d.timeRange}</span>{/if}
						</div>
					{/if}
				{/each}
			</div>
		</Callout>
	</div>

	<!-- ...then how everyone answered: the organizer's result cards, counts only. -->
	{#if rsvp}
		{#if rsvpOutcome}
			<div class="mt-8 flex flex-col gap-3.5">
				<SectionHeading text={m.distributionHeading()} />
				<div class="flex flex-col gap-3">
					{#each [{ key: 'coming', label: m.headcountComing(), count: rsvpOutcome.available }, { key: 'notComing', label: m.headcountNotComing(), count: rsvpOutcome.unavailable }] as row, i (row.key)}
						<div in:fly={flyIn(i)}>
							<HeadcountCard label={row.label} count={row.count} />
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{:else}
		<div class="mt-8 flex flex-col gap-3.5">
			<SectionHeading text={m.distributionHeading()} />
			<div class="flex flex-col gap-3">
				{#each outcome ?? [] as o, i (o.id)}
					{@const d = dateById.get(o.id)}
					{#if d}
						<div in:fly={flyIn(i)}>
							<ResultCard
								weekday={d.weekday}
								dateLabel={d.dateLabel}
								timeRange={d.timeRange}
								label={d.label}
								chosen={o.chosen}
								{pollType}
								preferred={o.preferred}
								available={o.available}
								unavailable={o.unavailable}
								preferredPct={o.preferredPct}
								availablePct={o.availablePct}
								unavailablePct={o.unavailablePct}
								{showPreferred}
								unsure={showUnsure ? o.unsure : undefined}
								value={valueKind
									? {
											kind: valueKind,
											avgPosition: o.valueCount ? o.valueSum / o.valueCount : null,
											valueSum: o.valueSum,
											sharePct: o.sharePct
										}
									: null}
							/>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
{/if}
