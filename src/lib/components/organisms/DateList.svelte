<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import DateRow from '$lib/components/molecules/DateRow.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import { da } from '$lib/da';
	import type { DateOption } from '$lib/types';

	let {
		dates = $bindable(),
		onadd,
		onremove
	}: {
		dates: DateOption[];
		onadd: () => void;
		onremove: (id: string) => void;
	} = $props();
</script>

<div>
	<div class="mb-1 text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
		{da.datesSection}
	</div>
	<p class="mb-3.5 text-[13px] text-ink-muted">{da.datesHint}</p>
	<div class="flex flex-col gap-2.5">
		{#each dates as date, i (date.id)}
			<div in:fly={{ y: 8, duration: 240, delay: i * 40, easing: cubicOut }}>
				<DateRow
					bind:date={dates[i]}
					index={i}
					onremove={() => {
						onremove(date.id);
					}}
				/>
			</div>
		{/each}
	</div>
	<Button variant="dashed" onclick={onadd}>{da.addDate}</Button>
</div>
