<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Callout from '$lib/components/molecules/Callout.svelte';
	import ResultBars from '$lib/components/molecules/ResultBars.svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import { CalendarCheck } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ResponseDateView } from '$lib/types';
	import type { OutcomeRow } from '$lib/logic/results';

	// What a participant sees once the poll is decided or cancelled: the
	// organizer's call, then counts only - names stay with the organizer.
	let {
		cancelled,
		dates,
		outcomeById
	}: {
		cancelled: boolean;
		dates: ResponseDateView[];
		outcomeById: Map<string, OutcomeRow>;
	} = $props();

	const chosenDates = $derived(dates.filter((d) => outcomeById.get(d.id)?.chosen));
</script>

{#if cancelled}
	<!-- No date, no distribution - just the organizer's call, spelled out. -->
	<Callout>
		<p class="text-body leading-relaxed text-ink-muted">{m.cancelledMessage()}</p>
	</Callout>
{:else}
	<!-- The outcome, front and center: the chosen date(s)... -->
	<div in:fly={{ y: 8, duration: 240, easing: cubicOut }}>
		<Callout
			tone="primary"
			title={chosenDates.length > 1 ? m.chosenDatesHeading() : m.chosenDateHeading()}
		>
			{#snippet icon()}<CalendarCheck size={16} class="shrink-0" />{/snippet}
			<div class="mt-1.5 flex flex-col gap-1">
				{#each chosenDates as d (d.id)}
					<div class="text-xl font-extrabold capitalize tracking-[-0.01em] text-ink">
						{d.weekday}
						{d.dateLabel}{#if d.timeRange}
							<span class="text-base font-semibold text-ink-muted">· {d.timeRange}</span>{/if}
					</div>
				{/each}
			</div>
		</Callout>
	</div>

	<!-- ...then how everyone answered, counts only - names stay with the organizer. -->
	<div class="mt-8 flex flex-col gap-3.5">
		<SectionHeading text={m.distributionHeading()} />
		{#each dates as d, i (d.id)}
			{@const o = outcomeById.get(d.id)}
			{#if o}
				<div
					in:fly={{ y: 8, duration: 240, delay: i * 40, easing: cubicOut }}
					class="rounded-xl border bg-card p-4 {o.chosen ? 'border-primary' : 'border-border'}"
				>
					<div class="flex flex-wrap items-center gap-2.5">
						<div>
							<div class="text-body font-bold capitalize text-ink">{d.weekday}</div>
							<div class="text-caption text-ink-muted">
								{d.dateLabel}{#if d.timeRange}
									· {d.timeRange}{/if}
							</div>
						</div>
						{#if o.chosen}
							<span
								class="whitespace-nowrap rounded-full bg-primary-tint px-2.5 py-1 text-2xs font-bold uppercase tracking-[0.04em] text-primary"
							>
								{m.chosenBadge()}
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
						/>
					</div>
				</div>
			{/if}
		{/each}
	</div>
{/if}
