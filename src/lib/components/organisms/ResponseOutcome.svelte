<script lang="ts">
	import { fly } from 'svelte/transition';
	import { flyIn } from '$lib/motion';
	import Callout from '$lib/components/molecules/Callout.svelte';
	import ResultBars from '$lib/components/molecules/ResultBars.svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import { CalendarCheck, CircleCheck } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import type { PollType, ResponseDateView } from '$lib/types';
	import type { OutcomeRow } from '$lib/logic/results';

	// What a participant sees once the poll is decided or cancelled: the
	// organizer's call, then counts only - names stay with the organizer.
	let {
		cancelled,
		dates,
		outcomeById,
		pollType = 'dates'
	}: {
		cancelled: boolean;
		dates: ResponseDateView[];
		outcomeById: Map<string, OutcomeRow>;
		pollType?: PollType;
	} = $props();

	const question = $derived(pollType === 'question');
	const rsvp = $derived(pollType === 'rsvp');
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

	<!-- ...then how everyone answered, counts only - names stay with the organizer. -->
	{#if rsvp}
		{#if rsvpOutcome}
			<div class="mt-8 flex flex-col gap-3.5">
				<SectionHeading text={m.distributionHeading()} />
				<div in:fly={flyIn()} class="rounded-card border-2 border-border bg-card-alt p-4">
					<div class="flex flex-wrap gap-x-6 gap-y-1">
						<span class="text-body text-ink">
							<span class="font-bold">{m.headcountComing()}</span>
							<span class="text-ink-soft">{rsvpOutcome.available}</span>
						</span>
						<span class="text-body text-ink">
							<span class="font-bold">{m.headcountNotComing()}</span>
							<span class="text-ink-soft">{rsvpOutcome.unavailable}</span>
						</span>
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<div class="mt-8 flex flex-col gap-3.5">
			<SectionHeading text={m.distributionHeading()} />
			{#each dates as d, i (d.id)}
				{@const o = outcomeById.get(d.id)}
				{#if o}
					<div
						in:fly={flyIn(i)}
						class="rounded-card border-2 bg-card-alt p-4 {o.chosen
							? 'border-ink'
							: 'border-border'}"
					>
						<div class="flex flex-wrap items-center gap-2.5">
							{#if d.label}
								<div class="text-body font-bold text-ink">{d.label}</div>
							{:else}
								<div>
									<div class="text-body font-bold capitalize text-ink">{d.weekday}</div>
									<div class="text-caption text-ink-muted">
										{d.dateLabel}{#if d.timeRange}
											· {d.timeRange}{/if}
									</div>
								</div>
							{/if}
							{#if o.chosen}
								<span
									class="whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-card"
								>
									{question ? m.chosenBadgeQuestion() : m.chosenBadge()}
								</span>
							{/if}
						</div>
						<div class="mt-4">
							<ResultBars
								preferred={o.preferred}
								available={o.available}
								unavailable={o.unavailable}
								preferredPct={o.preferredPct}
								availablePct={o.availablePct}
								unavailablePct={o.unavailablePct}
								{pollType}
							/>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
{/if}
