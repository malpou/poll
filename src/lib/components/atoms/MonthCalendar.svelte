<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { Locale } from '$lib/types';

	let {
		selected,
		ontoggle,
		locale
	}: {
		selected: string[]; // yyyy-mm-dd
		ontoggle: (day: string) => void;
		locale: Locale;
	} = $props();

	// Visible month, starting on today's.
	const today = new Date();
	let year = $state(today.getFullYear());
	let month = $state(today.getMonth()); // 0-11

	function move(delta: number) {
		const d = new Date(year, month + delta, 1);
		year = d.getFullYear();
		month = d.getMonth();
	}

	const iso = (day: number) =>
		`${String(year)}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

	// ponytail: Monday-first for every locale; per-locale week start via
	// Intl weekInfo if anyone ever asks.
	const grid = $derived.by(() => {
		const lead = (new Date(year, month, 1).getDay() + 6) % 7;
		const days = new Date(year, month + 1, 0).getDate();
		return { lead, days };
	});

	const monthLabel = $derived(
		new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
			new Date(year, month, 1)
		)
	);
	// Weekday initials in the poll's language; 2026-06-01 is a Monday.
	const weekdays = $derived.by(() => {
		const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
		return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2026, 5, 1 + i)));
	});

	const selectedSet = $derived(new Set(selected));
</script>

<div class="rounded-card border-2 border-border bg-card-alt p-3">
	<div class="mb-2 flex items-center justify-between gap-2">
		<Button variant="ghost" iconOnly label={m.prevMonth()} onclick={() => move(-1)}>
			<ChevronLeft size={14} />
		</Button>
		<span class="text-body font-bold capitalize text-ink">{monthLabel}</span>
		<Button variant="ghost" iconOnly label={m.nextMonth()} onclick={() => move(1)}>
			<ChevronRight size={14} />
		</Button>
	</div>
	<div class="grid grid-cols-7 gap-0.75">
		{#each weekdays as w (w)}
			<span class="py-1 text-center text-2xs font-bold uppercase tracking-wide text-ink-faint">
				{w}
			</span>
		{/each}
		{#each Array(grid.lead), i (i)}
			<span></span>
		{/each}
		{#each Array(grid.days), i (i)}
			{@const pressed = selectedSet.has(iso(i + 1))}
			<button
				type="button"
				aria-pressed={pressed}
				onclick={() => ontoggle(iso(i + 1))}
				class="grid h-9.5 cursor-pointer place-items-center rounded-full border-2 text-caption text-ink transition hover:border-ink {pressed
					? 'border-ink bg-hl font-bold'
					: 'border-transparent'}"
			>
				{i + 1}
			</button>
		{/each}
	</div>
</div>
