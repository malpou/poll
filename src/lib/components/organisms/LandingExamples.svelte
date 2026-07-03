<script lang="ts">
	import DateOptionCard from '$lib/components/molecules/DateOptionCard.svelte';
	import ResultBars from '$lib/components/molecules/ResultBars.svelte';
	import { m } from '$lib/paraglide/messages';
	import { formatDateOption } from '$lib/logic/date';
	import type { Locale, Preference } from '$lib/types';

	// One interactive example per poll type. Client-only toys: tapping an answer
	// moves that example's tally, nothing is submitted, reload resets. Sample
	// dates come from the landing load, computed relative to now.
	let {
		locale,
		samples
	}: {
		locale: Locale;
		samples: { dates: string[]; rsvp: string; tz: string };
	} = $props();

	// Fixed pretend-friends baseline per option; the visitor's tap adds one.
	interface Counts {
		preferred: number;
		available: number;
		unavailable: number;
	}
	const DATES_BASE: Counts[] = [
		{ preferred: 2, available: 1, unavailable: 0 },
		{ preferred: 0, available: 1, unavailable: 2 }
	];
	const RSVP_BASE: Counts = { preferred: 0, available: 3, unavailable: 1 };
	const QUESTION_BASE: Counts[] = [
		{ preferred: 0, available: 2, unavailable: 0 },
		{ preferred: 0, available: 1, unavailable: 1 },
		{ preferred: 0, available: 0, unavailable: 2 }
	];

	let dateAnswers = $state<(Preference | undefined)[]>([undefined, undefined]);
	let rsvpAnswer = $state<Preference | undefined>(undefined);
	let questionAnswers = $state<(Preference | undefined)[]>([undefined, undefined, undefined]);

	const questionOptions = $derived([
		m.landingSampleOptionA(),
		m.landingSampleOptionB(),
		m.landingSampleOptionC()
	]);

	const rsvpFmt = $derived(formatDateOption(samples.rsvp, null, locale, samples.tz));
	const rsvpTally = $derived(tally(RSVP_BASE, rsvpAnswer));

	function tally(base: Counts, mine: Preference | undefined) {
		const preferred = base.preferred + (mine === 'preferred' ? 1 : 0);
		const available = base.available + (mine === 'available' ? 1 : 0);
		const unavailable = base.unavailable + (mine === 'unavailable' ? 1 : 0);
		const total = preferred + available + unavailable;
		return {
			preferred,
			available,
			unavailable,
			preferredPct: (preferred / total) * 100,
			availablePct: (available / total) * 100,
			unavailablePct: (unavailable / total) * 100
		};
	}
</script>

{#snippet exampleHeader(typeLabel: string, sampleTitle: string)}
	<span
		class="w-fit rounded-full bg-hl px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-ink"
	>
		{typeLabel}
	</span>
	<h3 class="text-lead font-bold text-ink">{sampleTitle}</h3>
{/snippet}

<div class="flex flex-col gap-9">
	<section class="flex flex-col gap-3" data-testid="example-dates">
		{@render exampleHeader(m.pollTypeDates(), m.landingSampleDatesTitle())}
		{#each samples.dates as iso, i (iso)}
			{@const fmt = formatDateOption(iso, null, locale, samples.tz)}
			{@const t = tally(DATES_BASE[i], dateAnswers[i])}
			<div class="flex flex-col gap-2">
				<DateOptionCard
					id="demo-dates-{i}"
					index={i}
					weekday={fmt.weekday}
					dateLabel={fmt.dateLabel}
					timeRange={fmt.timeRange}
					bind:value={dateAnswers[i]}
				/>
				<ResultBars {...t} />
			</div>
		{/each}
	</section>

	<section class="flex flex-col gap-3" data-testid="example-rsvp">
		{@render exampleHeader(m.pollTypeRsvp(), m.landingSampleRsvpTitle())}
		<div class="flex flex-col gap-2">
			<DateOptionCard
				id="demo-rsvp"
				index={0}
				weekday={rsvpFmt.weekday}
				dateLabel={rsvpFmt.dateLabel}
				timeRange={rsvpFmt.timeRange}
				choices={['available', 'unavailable']}
				pollType="rsvp"
				bind:value={rsvpAnswer}
			/>
			<ResultBars {...rsvpTally} showPreferred={false} pollType="rsvp" />
		</div>
	</section>

	<section class="flex flex-col gap-3" data-testid="example-question">
		{@render exampleHeader(m.pollTypeQuestion(), m.landingSampleQuestionTitle())}
		{#each questionOptions as option, i (option)}
			{@const t = tally(QUESTION_BASE[i], questionAnswers[i])}
			<div class="flex flex-col gap-2">
				<DateOptionCard
					id="demo-question-{i}"
					index={i}
					weekday=""
					dateLabel=""
					timeRange=""
					label={option}
					choices={['available', 'unavailable']}
					pollType="question"
					bind:value={questionAnswers[i]}
				/>
				<ResultBars {...t} showPreferred={false} pollType="question" />
			</div>
		{/each}
	</section>
</div>
