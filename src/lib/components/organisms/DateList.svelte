<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import DateRow from '$lib/components/molecules/DateRow.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import { Plus } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
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
	<SectionHeading text={m.datesSection()} class="mb-1" />
	<p class="mb-3.5 text-[13px] text-ink-muted">{m.datesHint()}</p>
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
	<Button variant="dashed" onclick={onadd}><Plus size={16} />{m.addDate()}</Button>
</div>
