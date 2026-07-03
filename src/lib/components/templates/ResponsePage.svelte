<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import DateOptionCard from '$lib/components/molecules/DateOptionCard.svelte';
	import LinkNotFound from '$lib/components/molecules/LinkNotFound.svelte';
	import TextField from '$lib/components/atoms/TextField.svelte';
	import TextArea from '$lib/components/atoms/TextArea.svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import NoticeBanner from '$lib/components/atoms/NoticeBanner.svelte';
	import Toast from '$lib/components/atoms/Toast.svelte';
	import { createToast } from '$lib/components/atoms/create-toast.svelte';
	import ResponseOutcome from '$lib/components/organisms/ResponseOutcome.svelte';
	import RankResponse from '$lib/components/organisms/RankResponse.svelte';
	import HighlightResponse from '$lib/components/organisms/HighlightResponse.svelte';
	import SubmitBar from '$lib/components/organisms/SubmitBar.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { tzLabel } from '$lib/logic/date';
	import { isRichText } from '$lib/forms/richtext';
	import type { Accent, EventStatus, PollType, Preference, ResponseDateView } from '$lib/types';
	import type { OutcomeRow } from '$lib/logic/results';

	// Assigned (/r): name/answers/note come from the load. Open (/s): submitter
	// names themselves, so those are absent until the form is filled.
	interface ValidData {
		invalid: false;
		status: EventStatus;
		// Per-date counts + chosen flags on a decided poll; null while open, on a
		// cancelled poll, and on polls closed before decisions existed.
		outcome: OutcomeRow[] | null;
		name?: string;
		title: string;
		description: string | null;
		timezone: string;
		accent: Accent;
		pollType: PollType;
		// The event's enabled choices, in display order.
		choices: Preference[];
		dates: ResponseDateView[];
		answers?: Record<string, Preference>;
		// Rank positions / highlight stroke counts, keyed by option id.
		values?: Record<string, number>;
		highlightBudget?: number;
		note?: string;
	}

	let {
		data,
		mode = 'assigned',
		action = '?/save'
	}: {
		data: { invalid: true } | ValidData;
		mode?: 'assigned' | 'open';
		action?: string;
	} = $props();

	// Narrowed view for the template - avoids re-checking the union per binding.
	const view = $derived<ValidData | null>(data.invalid ? null : data);

	// Closed and cancelled both lock the form; a decided poll (closed with an
	// outcome) swaps the form for the chosen date(s) + distribution.
	const closed = $derived(!!view && view.status !== 'open');
	const cancelled = $derived(!!view && view.status === 'cancelled');
	const decided = $derived(!!view && view.status === 'closed' && view.outcome !== null);

	// Local editable state, seeded once from the load (revisits pre-select).
	// data only changes on navigation, which remounts this component.
	const seed = untrack(() => (data.invalid ? null : data));
	let name = $state(seed?.name ?? '');
	let answers = $state<Record<string, Preference | undefined>>({ ...(seed?.answers ?? {}) });
	let note = $state(seed?.note ?? '');
	// Frozen from the seed so cards keep their badges/order while the user picks.
	const hasAnswered =
		Object.keys(seed?.answers ?? {}).length > 0 || Object.keys(seed?.values ?? {}).length > 0;
	const hasNewDates = hasAnswered && (seed?.dates ?? []).some((d) => d.needsAnswer);
	// Outstanding new dates land the returning respondent straight in edit mode.
	let submitted = $state(hasAnswered && !hasNewDates);
	// Personal edit link handed back after an open submission (from the action).
	let editUrl = $state<string | null>(null);
	const toast = createToast();

	const question = $derived(!!view && view.pollType === 'question');
	const rsvp = $derived(!!view && view.pollType === 'rsvp');
	const rank = $derived(!!view && view.pollType === 'rank');
	const highlight = $derived(!!view && view.pollType === 'highlight');
	// Highlight's running spend, surfaced by its organism's onchange for the
	// submit gating; starts from the recorded answer's total.
	let strokesSpent = $state(Object.values(seed?.values ?? {}).reduce((a, b) => a + b, 0));
	const nameOk = $derived(mode === 'assigned' || name.trim().length > 0);
	const allAnswered = $derived(
		!!view &&
			nameOk &&
			view.dates.length > 0 &&
			(rank
				? true // a rank list is always a full order
				: highlight
					? strokesSpent >= 1
					: view.dates.every((d) => answers[d.id] !== undefined))
	);
</script>

{#if !view}
	<LinkNotFound />
{:else}
	<form
		method="POST"
		{action}
		use:enhance={() =>
			({ result, update }) => {
				if (result.type === 'success') {
					const url =
						result.data && typeof result.data.editUrl === 'string' ? result.data.editUrl : null;
					submitted = true;
					editUrl = url;
					toast.show(m.savedTitle());
					// A first open-mode submit hands back a one-time edit link. Skip the
					// reload then: re-running the /s load follows the fresh cookie to /r
					// and would remount the page, wiping the link before it can be read.
					return update({ reset: false, invalidateAll: url === null });
				}
				return update({ reset: false });
			}}
		data-accent={view.accent}
		class="mx-auto max-w-160 px-4 pb-18 pt-7"
	>
		<div class="paper-sheet">
			{#if cancelled}
				<NoticeBanner text={m.cancelledBanner()} class="mb-5.5" />
			{:else if closed && !decided}
				<!-- Poll closed before decisions existed: plain closed notice. -->
				<NoticeBanner text={m.closedBanner()} class="mb-5.5" />
			{/if}

			<div class="mb-7.5 flex flex-col gap-1.5">
				<!-- No greeting once closed: a decided/cancelled poll is an outcome, not a
			     personal ask, and the counts-only view must show no invitee name. -->
				{#if !closed}
					{#if mode === 'assigned'}
						<div class="text-lead text-ink-soft">
							{m.greeting({ name: view.name ?? '' })}
						</div>
					{:else if name.trim()}
						<div class="text-lead text-ink-soft">
							{m.greeting({ name: name.trim() })}
						</div>
					{/if}
				{/if}
				<h1 class="text-title font-bold text-ink"><span class="hl-swipe">{view.title}</span></h1>
				{#if view.description}
					{#if isRichText(view.description)}
						<!-- Editor HTML, sanitized to the allowed subset at write time. -->
						<div class="rich-text mt-1.5 text-base leading-relaxed text-ink-muted">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html view.description}
						</div>
					{:else}
						<p class="mt-1.5 whitespace-pre-line text-base leading-relaxed text-ink-muted">
							{view.description}
						</p>
					{/if}
				{/if}
			</div>

			{#if cancelled || decided}
				<ResponseOutcome
					{cancelled}
					dates={view.dates}
					outcome={view.outcome}
					choices={view.choices}
					pollType={view.pollType}
				/>
			{:else}
				<div class="flex flex-col gap-5">
					{#if mode === 'open'}
						<TextField
							label={m.namePrompt()}
							name="name"
							bind:value={name}
							placeholder={m.name()}
						/>
					{/if}
					<p class="text-lead font-semibold text-ink">
						{question
							? m.responseIntroQuestion()
							: rsvp
								? m.responseIntroRsvp()
								: rank
									? m.responseIntroRank()
									: highlight
										? m.responseIntroHighlight()
										: m.responseIntro()}
					</p>

					<div class="flex flex-col gap-3.5">
						<SectionHeading
							text={question
								? m.optionsQuestion()
								: rsvp
									? m.rsvpQuestion()
									: rank
										? m.rankQuestion()
										: highlight
											? m.highlightQuestion()
											: m.datesQuestion()}
						/>
						<!-- Only relevant when times exist; date-only and question polls have
						     no zone to name. -->
						{#if view.dates.some((d) => d.timeRange)}
							<p class="text-caption text-ink-muted">
								{m.timezoneNote({ timezone: tzLabel(view.timezone, getLocale()) })}
							</p>
						{/if}
						{#if hasNewDates && !closed}
							<NoticeBanner
								text={question || rank || highlight ? m.newOptionsBanner() : m.newDatesBanner()}
								tone="ink"
							/>
						{/if}
						{#if rank}
							<p class="text-caption text-ink-muted">{m.reorderHint()}</p>
							<RankResponse options={view.dates} readOnly={closed || submitted} />
						{:else if highlight}
							<HighlightResponse
								options={view.dates}
								budget={view.highlightBudget ?? 5}
								values={view.values ?? {}}
								onchange={(counts: Record<string, number>) =>
									(strokesSpent = Object.values(counts).reduce((a, b) => a + b, 0))}
								readOnly={closed || submitted}
							/>
						{:else}
							{#each view.dates as d, i (d.id)}
								<DateOptionCard
									id={d.id}
									weekday={d.weekday}
									dateLabel={d.dateLabel}
									timeRange={d.timeRange}
									label={d.label}
									index={i}
									bind:value={answers[d.id]}
									choices={view.choices}
									readOnly={closed || submitted}
									isNew={d.needsAnswer ?? false}
									pollType={view.pollType}
								/>
							{/each}
						{/if}
					</div>

					<div class="mt-1.5 flex flex-col gap-2">
						<TextArea
							label={m.noteLabel()}
							name="note"
							bind:value={note}
							placeholder={m.notePlaceholder()}
							disabled={closed || submitted}
						/>
					</div>
				</div>
			{/if}

			{#if !closed}
				<SubmitBar
					bind:submitted
					{allAnswered}
					{editUrl}
					pollType={view.pollType}
					oncopied={() => {
						toast.show(m.linkCopied());
					}}
				/>
			{/if}
		</div>
	</form>

	<Toast open={toast.open} text={toast.text} />
{/if}
