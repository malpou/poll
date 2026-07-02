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
	import type { Locale, ResultView } from '$lib/types';

	let {
		results,
		respondedLabel,
		allowPreferred,
		allowUnsure,
		closed,
		selecting = $bindable(),
		locale
	}: {
		results: ResultView[];
		respondedLabel: string;
		allowPreferred: boolean;
		allowUnsure: boolean;
		closed: boolean;
		selecting: boolean;
		locale: Locale;
	} = $props();

	// Closing flow: each result card gets a checkbox; confirming posts the ids.
	let picked = $state<Record<string, boolean>>({});
	const pickedIds = $derived(Object.keys(picked).filter((id) => picked[id]));

	const leaveSelection = () => {
		selecting = false;
		picked = {};
	};
</script>

{#key locale}
	{#if results.length > 0}
		<section class="mb-10">
			<SectionHeading text={m.resultsSection()} class="mb-1" />
			<!-- One "who answered" summary for the whole poll, not per card. -->
			<div class="mb-3.5 text-caption font-semibold text-ink-muted">{respondedLabel}</div>
			{#if selecting}
				<div class="mb-3.5 text-caption font-semibold text-primary">{m.closeSelectHint()}</div>
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
								<!-- The closing pick: one checkbox per date, posted on confirm. -->
								<input
									type="checkbox"
									aria-label={m.selectDateLabel()}
									checked={picked[r.id] ?? false}
									onchange={() => (picked[r.id] = !picked[r.id])}
									class="h-5 w-5 shrink-0 translate-y-1 cursor-pointer accent-ink"
								/>
							{/if}
							<span class="text-lead font-bold capitalize text-ink">{r.weekday}</span>
							<span class="text-body text-ink-soft">{r.dateLabel}</span>
							{#if r.timeRange}
								<span class="text-caption text-ink-muted">{r.timeRange}</span>
							{/if}
							{#if r.chosen}
								<span
									class="ml-auto whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-card"
								>
									{m.chosenBadge()}
								</span>
							{:else if r.isBest && !closed}
								<!-- The recommendation only matters while the call is still open. -->
								<span
									class="ml-auto inline-flex -rotate-1 items-center gap-1 whitespace-nowrap rounded-full bg-hl px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-ink"
								>
									<Star size={11} fill="currentColor" aria-hidden="true" />
									{m.bestDate()}
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
						use:enhance={confirmingRefresh(m.confirmCancelPoll(), true, leaveSelection)}
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
