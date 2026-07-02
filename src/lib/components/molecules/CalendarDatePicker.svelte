<script lang="ts">
	import { fly } from 'svelte/transition';
	import { flyIn } from '$lib/motion';
	import MonthCalendar from '$lib/components/atoms/MonthCalendar.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import IconButton from '$lib/components/atoms/IconButton.svelte';
	import TextField from '$lib/components/atoms/TextField.svelte';
	import { Plus, X } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import { helpers } from '$lib/data/shared';
	import type { DateOption, Locale } from '$lib/types';

	// Days toggled in the calendar, each with optional time slots. One entry in
	// `dates` per (day, slot); a slot-less day is one entry with empty times.
	// Entries post as indexed `{name}.{i}.value/startTime/endTime` fields, the
	// same wire shape the old date rows used.
	let {
		dates = $bindable(),
		locale,
		name = 'dates',
		single = false
	}: {
		dates: DateOption[];
		locale: Locale;
		name?: string;
		// RSVP polls have exactly one date: picking a day replaces the previous
		// pick, and the extra-time-slot affordance is hidden.
		single?: boolean;
	} = $props();

	// Group entries by day for display, keeping each entry's flat index for its
	// input names. Days sort chronologically (ISO strings compare lexically).
	const byDay = $derived.by(() => {
		const groups: { day: string; entries: { date: DateOption; index: number }[] }[] = [];
		dates.forEach((date, index) => {
			let g = groups.find((x) => x.day === date.value);
			if (!g) groups.push((g = { day: date.value, entries: [] }));
			g.entries.push({ date, index });
		});
		return groups.sort((a, b) => a.day.localeCompare(b.day));
	});

	function toggleDay(day: string) {
		if (dates.some((d) => d.value === day)) dates = dates.filter((d) => d.value !== day);
		else if (single) dates = [{ ...helpers.blankDate(), value: day }];
		else dates.push({ ...helpers.blankDate(), value: day });
	}
	function addSlot(day: string) {
		dates.push({ ...helpers.blankDate(), value: day });
	}
	// Removing a day's last slot deselects the day.
	function removeSlot(id: string) {
		dates = dates.filter((d) => d.id !== id);
	}

	const dayLabel = (day: string) =>
		new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(
			new Date(`${day}T12:00:00`)
		);
</script>

<MonthCalendar selected={dates.map((d) => d.value)} ontoggle={toggleDay} {locale} />

{#if dates.length === 0}
	<p class="mt-2.5 text-caption italic text-ink-faint">{m.calendarEmptyHint()}</p>
{/if}

<div class="mt-2.5 flex flex-col gap-2.5">
	{#each byDay as { day, entries } (day)}
		<div in:fly={flyIn()} class="rounded-card border-2 border-border bg-card-alt p-3">
			<div class="text-body font-bold text-ink">
				<span class="capitalize">{dayLabel(day)}</span>
			</div>
			<div class="mt-2 flex flex-col gap-2">
				{#each entries as { date, index } (date.id)}
					<div class="flex items-center gap-3.5">
						<input type="hidden" name="{name}.{index}.value" value={date.value} />
						<div class="flex min-w-0 flex-1 items-center gap-2">
							<span class="shrink-0 text-xs font-semibold text-ink-muted">{m.from()}</span>
							<TextField
								type="time"
								compact
								name="{name}.{index}.startTime"
								bind:value={dates[index].startTime}
							/>
						</div>
						<div class="flex min-w-0 flex-1 items-center gap-2">
							<span class="shrink-0 text-xs font-semibold text-ink-muted">{m.to()}</span>
							<TextField
								type="time"
								compact
								name="{name}.{index}.endTime"
								bind:value={dates[index].endTime}
							/>
						</div>
						<IconButton label={m.remove()} onclick={() => removeSlot(date.id)}>
							<X size={14} />
						</IconButton>
					</div>
				{/each}
			</div>
			{#if !single}
				<div class="mt-2">
					<Button variant="dashed" onclick={() => addSlot(day)}>
						<Plus size={14} />{m.addTime()}
					</Button>
				</div>
			{/if}
		</div>
	{/each}
</div>
