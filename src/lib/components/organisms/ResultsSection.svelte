<script lang="ts">
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { flyIn, flipParams } from '$lib/motion';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import ResultBars from '$lib/components/molecules/ResultBars.svelte';
	import { Lock, Star } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import { refreshThen, confirmingRefresh } from '$lib/forms/enhance';
	import type { Locale, PollType, ResultView } from '$lib/types';

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

	const question = $derived(pollType === 'question');
	const rsvp = $derived(pollType === 'rsvp');

	// Closing flow: each result card gets a checkbox; confirming posts the ids.
	let picked = $state<Record<string, boolean>>({});
	const pickedIds = $derived(Object.keys(picked).filter((id) => picked[id]));

	const leaveSelection = () => {
		selecting = false;
		picked = {};
	};
</script>

{#key locale}
	{#if rsvp && results.length > 0}
		<!-- RSVP: a headcount instead of the per-option matrix - coming / not
		     coming / pending with names (names stay with the organizer). Closing
		     is confirm-or-cancel; no option to pick. -->
		{@const r = results[0]}
		<section class="mb-10">
			<SectionHeading text={m.resultsSection()} class="mb-1" />
			<div class="mb-3.5 text-caption font-semibold text-ink-muted">{respondedLabel}</div>
			{#if selecting}
				<div class="mb-3.5 text-caption font-semibold text-primary">{m.closeSelectHintRsvp()}</div>
			{/if}
			<div class="flex flex-col gap-3">
				{#each [{ key: 'coming', label: m.headcountComing(), count: r.available, names: r.availableNames }, { key: 'notComing', label: m.headcountNotComing(), count: r.unavailable, names: r.unavailableNames }, { key: 'pending', label: m.pending(), count: pendingNames.length, names: pendingNames }] as row, i (row.key)}
					{#if row.key !== 'pending' || row.count > 0}
						<div in:fly={flyIn(i)} class="rounded-card border-2 border-border bg-card-alt p-4">
							<div class="flex items-baseline gap-2.5">
								<span class="text-lead font-bold text-ink">{row.label}</span>
								<span class="text-body font-semibold text-ink-soft">{row.count}</span>
							</div>
							{#if row.names.length > 0}
								<p class="mt-1 text-caption text-ink-muted">{row.names.join(', ')}</p>
							{/if}
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
					<div
						in:fly={flyIn(i)}
						animate:flip={flipParams()}
						class="rounded-card border-2 bg-card-alt p-4 transition-colors duration-150 {(selecting &&
							picked[r.id]) ||
						r.chosen ||
						(r.isBest && !closed)
							? 'border-ink'
							: 'border-border'}"
					>
						<div class="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
							{#if selecting}
								<!-- The closing pick: one checkbox per option, posted on confirm. -->
								<input
									type="checkbox"
									aria-label={question ? m.selectOptionLabel() : m.selectDateLabel()}
									checked={picked[r.id] ?? false}
									onchange={() => (picked[r.id] = !picked[r.id])}
									class="h-5 w-5 shrink-0 translate-y-1 cursor-pointer accent-ink"
								/>
							{/if}
							{#if r.label}
								<span class="text-lead font-bold text-ink">{r.label}</span>
							{:else}
								<span class="text-lead font-bold capitalize text-ink">{r.weekday}</span>
								<span class="text-body text-ink-soft">{r.dateLabel}</span>
								{#if r.timeRange}
									<span class="text-caption text-ink-muted">{r.timeRange}</span>
								{/if}
							{/if}
							{#if r.chosen}
								<span
									class="ml-auto whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-card"
								>
									{question ? m.chosenBadgeQuestion() : m.chosenBadge()}
								</span>
							{:else if r.isBest && !closed}
								<!-- The recommendation only matters while the call is still open. -->
								<span
									class="ml-auto inline-flex -rotate-1 items-center gap-1 whitespace-nowrap rounded-full bg-hl px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-ink"
								>
									<Star size={11} fill="currentColor" aria-hidden="true" />
									{question ? m.bestOption() : m.bestDate()}
								</span>
							{/if}
						</div>

						<div class="mt-3">
							<ResultBars
								preferred={r.preferred}
								available={r.available}
								unavailable={r.unavailable}
								preferredPct={r.preferredPct}
								availablePct={r.availablePct}
								unavailablePct={r.unavailablePct}
								showPreferred={allowPreferred}
								{pollType}
								unsure={allowUnsure ? r.unsure : undefined}
								names={{
									preferred: r.preferredNames,
									available: r.availableNames,
									unavailable: r.unavailableNames,
									unsure: r.unsureNames
								}}
							/>
						</div>
					</div>
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
{/key}
