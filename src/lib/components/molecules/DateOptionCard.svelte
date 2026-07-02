<script lang="ts">
	import { fly } from 'svelte/transition';
	import { flyIn } from '$lib/motion';
	import SegmentedControl from '$lib/components/atoms/SegmentedControl.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { PollType, Preference } from '$lib/types';

	let {
		id,
		weekday,
		dateLabel,
		timeRange,
		label = '',
		index,
		value = $bindable(),
		choices,
		readOnly = false,
		isNew = false,
		pollType = 'dates'
	}: {
		id: string;
		weekday: string;
		dateLabel: string;
		timeRange: string;
		// Question polls: the option's text, rendered instead of the date row.
		label?: string;
		index: number;
		value: Preference | undefined;
		choices?: Preference[];
		readOnly?: boolean;
		isNew?: boolean;
		pollType?: PollType;
	} = $props();
</script>

<div
	data-testid="date-card-{id}"
	in:fly={flyIn(index)}
	class="flex flex-col gap-3.5 rounded-card border-2 border-border bg-card-alt p-4.5"
>
	<div class="flex flex-col gap-1">
		{#if isNew}
			<span
				class="mb-1 w-fit whitespace-nowrap rounded-full bg-hl px-2.5 py-1 text-2xs font-bold text-ink"
			>
				{m.newDateBadge()}
			</span>
		{/if}
		{#if label}
			<!-- Question option: its text, no capitalize (it's the organizer's prose). -->
			<div class="text-lead font-bold text-ink">{label}</div>
		{:else}
			<!-- One baseline row: weekday + date, the time pushed right (DESIGN.md). -->
			<div class="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
				<span class="text-lead font-bold capitalize text-ink">{weekday}</span>
				<span class="text-body text-ink-soft">{dateLabel}</span>
				{#if timeRange}
					<span class="ml-auto text-caption text-ink-muted">{timeRange}</span>
				{/if}
			</div>
		{/if}
	</div>
	<SegmentedControl bind:value {choices} {readOnly} {pollType} />
	<!-- Only submits a row when marked; unmarked = no field = no response row. -->
	{#if value}
		<input type="hidden" name="pref.{id}" {value} />
	{/if}
</div>
