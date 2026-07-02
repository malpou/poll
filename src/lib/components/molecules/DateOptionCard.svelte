<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
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

	// Staggered list entrance: 40ms × index (DESIGN.md). fly honors
	// prefers-reduced-motion via the media query below.
	const reduced =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
</script>

<div
	data-testid="date-card-{id}"
	in:fly={{
		y: reduced ? 0 : 8,
		duration: reduced ? 120 : 240,
		delay: index * 40,
		easing: cubicOut
	}}
	class="flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-[18px] shadow-[0_1px_2px_var(--shadow-toast)]"
>
	<div class="flex flex-col gap-0.5">
		{#if isNew}
			<span
				class="mb-1 w-fit whitespace-nowrap rounded-full bg-primary-tint px-2.5 py-1 text-[11px] font-bold text-primary"
			>
				{m.newDateBadge()}
			</span>
		{/if}
		<div class="text-lg font-bold capitalize tracking-[-0.01em] text-ink">{weekday}</div>
		<div class="text-sm text-ink-muted">{dateLabel}</div>
		{#if timeRange}
			<div class="text-[13px] font-semibold text-ink-muted">{timeRange}</div>
		{/if}
	</div>
	<SegmentedControl bind:value {readOnly} />
	<!-- Only submits a row when marked; unmarked = no field = no response row. -->
	{#if value}
		<input type="hidden" name="pref.{id}" {value} />
	{/if}
</div>
