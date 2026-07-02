<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import DateRow from '$lib/components/molecules/DateRow.svelte';
	import AddDateForm from '$lib/components/molecules/AddDateForm.svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { DateOption } from '$lib/types';

	let {
		dates = $bindable(),
		onadd,
		onremove
	}: {
		dates: DateOption[];
		onadd: (d: Omit<DateOption, 'id'>) => void;
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
	<AddDateForm {onadd} />
</div>
