<script lang="ts">
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { flyIn, flipParams } from '$lib/motion';
	import LocaleSwap from '$lib/components/atoms/LocaleSwap.svelte';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import HeadcountCard from '$lib/components/molecules/HeadcountCard.svelte';
	import ResultCard from '$lib/components/molecules/ResultCard.svelte';
	import { Lock } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import { refreshThen, confirmingRefresh } from '$lib/forms/enhance';
	import { isTextPollType, type Locale, type PollType, type ResultView } from '$lib/types';

	let {
		results,
		respondedLabel,
		allowPreferred,
		allowUnsure,
		closed,
		selecting = $bindable(),
		locale,
		pollType = 'dates',
		pendingNames = []
	}: {
		results: ResultView[];
		respondedLabel: string;
		allowPreferred: boolean;
		allowUnsure: boolean;
		closed: boolean;
		selecting: boolean;
		locale: Locale;
		pollType?: PollType;
		// RSVP headcount only: who hasn't answered (assigned mode; empty in open
		// mode, which has no fixed roster).
		pendingNames?: string[];
	} = $props();

	const question = $derived(isTextPollType(pollType));
	const rsvp = $derived(pollType === 'rsvp');
	// Rank/highlight cards show value summaries instead of preference bars.
	const valueKind = $derived(pollType === 'rank' || pollType === 'highlight' ? pollType : null);

	// Closing flow: each result card gets a checkbox; confirming posts the ids.
	let picked = $state<Record<string, boolean>>({});
	const pickedIds = $derived(Object.keys(picked).filter((id) => picked[id]));

	const leaveSelection = () => {
		selecting = false;
		picked = {};
	};
</script>

<LocaleSwap {locale}>
	{#if rsvp && results.length > 0}
		<!-- RSVP: a headcount instead of the per-option matrix - coming / not
		     coming / pending with names (names stay with the organizer). Closing
		     is confirm-or-cancel; no option to pick. -->
		{@const r = results[0]}
		<section class="mb-10">
			<SectionHeading text={m.resultsSection()} class="mb-1" />
			<div class="mb-3.5 text-caption font-semibold text-ink-muted">{respondedLabel}</div>
			{#if selecting}
				<div class="mb-3.5 text-caption font-semibold text-primary">
					{m.closeSelectHintRsvp()}
				</div>
			{/if}
			<div class="flex flex-col gap-3">
				{#each [{ key: 'coming', label: m.headcountComing(), count: r.available, names: r.availableNames }, { key: 'notComing', label: m.headcountNotComing(), count: r.unavailable, names: r.unavailableNames }, { key: 'pending', label: m.pending(), count: pendingNames.length, names: pendingNames }] as row, i (row.key)}
					{#if row.key !== 'pending' || row.count > 0}
						<div in:fly={flyIn(i)}>
							<HeadcountCard label={row.label} count={row.count} names={row.names} />
						</div>
					{/if}
				{/each}
			</div>

			{#if selecting}
				<!-- Confirm the event, cancel the whole poll (called off), or back out. -->
				<div class="mt-4 flex flex-wrap items-center gap-2.5">
					<form method="POST" action="?/close" use:enhance={refreshThen(leaveSelection)}>
						<Button variant="ghost" type="submit">
							<Lock size={14} />{m.confirmEventRsvp()}
						</Button>
					</form>
					<form
						method="POST"
						action="?/cancel"
						use:enhance={confirmingRefresh(m.confirmCancelPollRsvp(), true, leaveSelection)}
					>
						<Button variant="ghost" type="submit">{m.cancelPoll()}</Button>
					</form>
					<Button variant="ghost" onclick={leaveSelection}>
						{m.closeBack()}
					</Button>
				</div>
			{/if}
		</section>
	{:else if results.length > 0}
		<section class="mb-10">
			<SectionHeading text={m.resultsSection()} class="mb-1" />
			<!-- One "who answered" summary for the whole poll, not per card. -->
			<div class="mb-3.5 text-caption font-semibold text-ink-muted">{respondedLabel}</div>
			{#if selecting}
				<div class="mb-3.5 text-caption font-semibold text-primary">
					{question ? m.closeSelectHintQuestion() : m.closeSelectHint()}
				</div>
			{/if}
			<div class="flex flex-col gap-3">
				{#each results as r, i (r.id)}
					<!-- While closing, the whole card is the pick target: a label wraps
					     the card so a click anywhere toggles its checkbox (native, so
					     keyboard + a11y come for free, no double-toggle). Inert when not
					     selecting - the card has no control inside then. -->
					<svelte:element
						this={selecting ? 'label' : 'div'}
						in:fly={flyIn(i)}
						animate:flip={flipParams()}
						class={selecting ? 'block cursor-pointer' : 'block'}
					>
						<ResultCard
							weekday={r.weekday}
							dateLabel={r.dateLabel}
							timeRange={r.timeRange}
							label={r.label}
							chosen={r.chosen}
							best={r.isBest && !closed}
							highlighted={selecting && (picked[r.id] ?? false)}
							{pollType}
							preferred={r.preferred}
							available={r.available}
							unavailable={r.unavailable}
							preferredPct={r.preferredPct}
							availablePct={r.availablePct}
							unavailablePct={r.unavailablePct}
							showPreferred={allowPreferred}
							unsure={allowUnsure ? r.unsure : undefined}
							names={{
								preferred: r.preferredNames,
								available: r.availableNames,
								unavailable: r.unavailableNames,
								unsure: r.unsureNames
							}}
							value={valueKind
								? {
										kind: valueKind,
										avgPosition: r.avgPosition,
										valueSum: r.valueSum,
										sharePct: r.sharePct,
										names: r.valueNames
									}
								: null}
						>
							{#snippet leading()}
								{#if selecting}
									<!-- The closing pick: one checkbox per option, posted on confirm.
									     The wrapping label forwards card clicks to it. -->
									<input
										type="checkbox"
										aria-label={question ? m.selectOptionLabel() : m.selectDateLabel()}
										checked={picked[r.id] ?? false}
										onchange={() => (picked[r.id] = !picked[r.id])}
										class="h-5 w-5 shrink-0 translate-y-1 cursor-pointer accent-ink"
									/>
								{/if}
							{/snippet}
						</ResultCard>
					</svelte:element>
				{/each}
			</div>

			{#if selecting}
				<!-- Confirm the pick, cancel the whole poll (no decision), or back out. -->
				<div class="mt-4 flex flex-wrap items-center gap-2.5">
					<form method="POST" action="?/close" use:enhance={refreshThen(leaveSelection)}>
						{#each pickedIds as id (id)}
							<input type="hidden" name="selectedOptionIds" value={id} />
						{/each}
						<Button variant="ghost" type="submit" disabled={pickedIds.length === 0}>
							<Lock size={14} />{m.confirmClose()}
						</Button>
					</form>
					<form
						method="POST"
						action="?/cancel"
						use:enhance={confirmingRefresh(
							question ? m.confirmCancelPollQuestion() : m.confirmCancelPoll(),
							true,
							leaveSelection
						)}
					>
						<Button variant="ghost" type="submit">{m.cancelPoll()}</Button>
					</form>
					<Button variant="ghost" onclick={leaveSelection}>
						{m.closeBack()}
					</Button>
				</div>
			{/if}
		</section>
	{/if}
</LocaleSwap>
