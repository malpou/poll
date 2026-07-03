<script lang="ts">
	import DateOptionCard from '$lib/components/molecules/DateOptionCard.svelte';
	import ResultBars from '$lib/components/molecules/ResultBars.svelte';
	import ValueResult from '$lib/components/molecules/ValueResult.svelte';
	import RankResponse from '$lib/components/organisms/RankResponse.svelte';
	import HighlightResponse from '$lib/components/organisms/HighlightResponse.svelte';
	import { m } from '$lib/paraglide/messages';
	import { formatDateOption } from '$lib/logic/date';
	import { rankFillPct } from '$lib/logic/results';
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
	const rankOptions = $derived([
		m.landingSampleRankOptionA(),
		m.landingSampleRankOptionB(),
		m.landingSampleRankOptionC()
	]);
	const highlightOptions = $derived([
		m.landingSampleHighlightOptionA(),
		m.landingSampleHighlightOptionB(),
		m.landingSampleHighlightOptionC()
	]);

	// Rank demo: two pretend-friend ballots (positions per option index) plus
	// the visitor's live order; the tally shows each option's average position.
	const RANK_BALLOTS = [
		[1, 2, 3],
		[2, 1, 3]
	];
	let rankPositions = $state([1, 2, 3]);
	const rankAvg = $derived(
		rankPositions.map(
			(p, i) => (RANK_BALLOTS[0][i] + RANK_BALLOTS[1][i] + p) / (RANK_BALLOTS.length + 1)
		)
	);
	function onRankReorder(ids: string[]) {
		rankPositions = rankPositions.map((_, i) => ids.indexOf(`demo-rank-${String(i)}`) + 1);
	}

	// Highlight demo: pretend friends already spent some strokes; the visitor's
	// strokes join the totals and the share bars follow.
	const HIGHLIGHT_BASE = [3, 1, 0];
	let myStrokes = $state<Record<string, number>>({});
	const strokeTotals = $derived(
		HIGHLIGHT_BASE.map((base, i) => base + (myStrokes[`demo-highlight-${String(i)}`] ?? 0))
	);
	const allStrokes = $derived(strokeTotals.reduce((a, b) => a + b, 0));

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

	<!-- Order mirrors the create form: dates first, the text-option trio
	     (rank, question, highlight) in the middle, RSVP last. -->
	<section class="flex flex-col gap-3" data-testid="example-rank">
		{@render exampleHeader(m.pollTypeRank(), m.landingSampleRankTitle())}
		{#key rankOptions}
			<RankResponse
				options={rankOptions.map((label, i) => ({
					id: `demo-rank-${String(i)}`,
					label,
					weekday: '',
					dateLabel: '',
					timeRange: ''
				}))}
				onreorder={onRankReorder}
			/>
		{/key}
		<div class="flex flex-col gap-2">
			{#each rankOptions as option, i (option)}
				<div class="flex flex-col gap-1" data-testid="rank-tally-{i}">
					<span class="text-caption font-semibold text-ink">{option}</span>
					<ValueResult
						kind="rank"
						avgPosition={rankAvg[i]}
						valueSum={0}
						sharePct={rankFillPct(rankAvg[i], rankOptions.length)}
					/>
				</div>
			{/each}
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

	<section class="flex flex-col gap-3" data-testid="example-highlight">
		{@render exampleHeader(m.pollTypeHighlight(), m.landingSampleHighlightTitle())}
		{#key highlightOptions}
			<HighlightResponse
				options={highlightOptions.map((label, i) => ({
					id: `demo-highlight-${String(i)}`,
					label,
					weekday: '',
					dateLabel: '',
					timeRange: ''
				}))}
				budget={5}
				onchange={(counts: Record<string, number>) => (myStrokes = counts)}
			/>
		{/key}
		<div class="flex flex-col gap-2">
			{#each highlightOptions as option, i (option)}
				<div class="flex flex-col gap-1" data-testid="highlight-tally-{i}">
					<span class="text-caption font-semibold text-ink">{option}</span>
					<ValueResult
						kind="highlight"
						valueSum={strokeTotals[i]}
						sharePct={allStrokes ? Math.round((strokeTotals[i] / allStrokes) * 100) : 0}
					/>
				</div>
			{/each}
		</div>
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
</div>
