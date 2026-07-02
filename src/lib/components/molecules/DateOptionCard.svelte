<script lang="ts">
	import { fly } from 'svelte/transition';
	import { flyIn } from '$lib/motion';
	import SegmentedControl from '$lib/components/atoms/SegmentedControl.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { Preference } from '$lib/types';

	let {
		id,
		weekday,
		dateLabel,
		timeRange,
		index,
		value = $bindable(),
		readOnly = false,
		isNew = false
	}: {
		id: string;
		weekday: string;
		dateLabel: string;
		timeRange: string;
		index: number;
		value: Preference | undefined;
		readOnly?: boolean;
		isNew?: boolean;
	} = $props();
</script>

<div
	data-testid="date-card-{id}"
	in:fly={flyIn(index)}
	class="flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-4.5 shadow-[0_1px_2px_var(--shadow-toast)]"
>
	<div class="flex flex-col gap-0.5">
		{#if isNew}
			<span
				class="mb-1 w-fit whitespace-nowrap rounded-full bg-primary-tint px-2.5 py-1 text-2xs font-bold text-primary"
			>
				{m.newDateBadge()}
			</span>
		{/if}
		<div class="text-lg font-bold capitalize tracking-[-0.01em] text-ink">{weekday}</div>
		<div class="text-sm text-ink-muted">{dateLabel}</div>
		{#if timeRange}
			<div class="text-caption font-semibold text-ink-muted">{timeRange}</div>
		{/if}
	</div>
	<SegmentedControl bind:value {readOnly} />
	<!-- Only submits a row when marked; unmarked = no field = no response row. -->
	{#if value}
		<input type="hidden" name="pref.{id}" {value} />
	{/if}
</div>
