<script lang="ts">
	import { untrack } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { enhance } from '$app/forms';
	import DateOptionCard from '$lib/components/molecules/DateOptionCard.svelte';
	import ResultBars from '$lib/components/molecules/ResultBars.svelte';
	import CopyLinkRow from '$lib/components/molecules/CopyLinkRow.svelte';
	import LinkNotFound from '$lib/components/molecules/LinkNotFound.svelte';
	import TextField from '$lib/components/atoms/TextField.svelte';
	import TextArea from '$lib/components/atoms/TextArea.svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import Toast from '$lib/components/atoms/Toast.svelte';
	import { createToast } from '$lib/components/atoms/create-toast.svelte';
	import { Check, Send, CalendarCheck } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import type { EventStatus, Preference } from '$lib/types';
	import type { OutcomeRow } from '$lib/results';

	interface CardData {
		id: string;
		weekday: string;
		dateLabel: string;
		timeRange: string;
		// Set by the /r load for returning respondents: dates added since they
		// answered arrive first in the list and flagged. Absent on /s.
		needsAnswer?: boolean;
	}
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
		dates: CardData[];
		answers?: Record<string, Preference>;
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
	const outcomeById = $derived(new Map((view?.outcome ?? []).map((o) => [o.id, o])));
	const chosenDates = $derived(view ? view.dates.filter((d) => outcomeById.get(d.id)?.chosen) : []);

	// Local editable state, seeded once from the load (revisits pre-select).
	// data only changes on navigation, which remounts this component.
	const seed = untrack(() => (data.invalid ? null : data));
	let name = $state(seed?.name ?? '');
	let answers = $state<Record<string, Preference | undefined>>({ ...(seed?.answers ?? {}) });
	let note = $state(seed?.note ?? '');
	// Frozen from the seed so cards keep their badges/order while the user picks.
	const hasAnswered = Object.keys(seed?.answers ?? {}).length > 0;
	const hasNewDates = hasAnswered && (seed?.dates ?? []).some((d) => d.needsAnswer);
	// Outstanding new dates land the returning respondent straight in edit mode.
	let submitted = $state(hasAnswered && !hasNewDates);
	// Personal edit link handed back after an open submission (from the action).
	let editUrl = $state<string | null>(null);
	const toast = createToast();

	const nameOk = $derived(mode === 'assigned' || name.trim().length > 0);
	const allAnswered = $derived(
		!!view &&
			nameOk &&
			view.dates.length > 0 &&
			view.dates.every((d) => answers[d.id] !== undefined)
	);

	function onSubmitted(url: string | null) {
		submitted = true;
		editUrl = url;
		toast.show(m.savedTitle());
	}
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
					onSubmitted(url);
				}
				return update({ reset: false });
			}}
		class="mx-auto max-w-[480px] px-5 pb-32 pt-8"
	>
		{#if cancelled}
			<div
				class="mb-[22px] flex items-center gap-2.5 rounded-xl border border-border bg-amber-tint px-4 py-3 text-sm font-semibold text-amber"
			>
				<span class="h-2 w-2 shrink-0 rounded-full bg-amber"></span>
				{m.cancelledBanner()}
			</div>
		{:else if closed && !decided}
			<!-- Poll closed before decisions existed: plain closed notice. -->
			<div
				class="mb-[22px] flex items-center gap-2.5 rounded-xl border border-border bg-amber-tint px-4 py-3 text-sm font-semibold text-amber"
			>
				<span class="h-2 w-2 shrink-0 rounded-full bg-amber"></span>
				{m.closedBanner()}
			</div>
		{/if}

		<div class="mb-[30px] flex flex-col gap-1.5">
			<!-- No greeting once closed: a decided/cancelled poll is an outcome, not a
			     personal ask, and the counts-only view must show no invitee name. -->
			{#if !closed}
				{#if mode === 'assigned'}
					<div class="text-[15px] font-semibold text-primary">
						{m.greeting({ name: view.name ?? '' })}
					</div>
				{:else if name.trim()}
					<div class="text-[15px] font-semibold text-primary">
						{m.greeting({ name: name.trim() })}
					</div>
				{/if}
			{/if}
			<h1 class="text-[30px] font-extrabold tracking-[-0.02em] text-ink">{view.title}</h1>
			{#if view.description}
				<p class="mt-1.5 whitespace-pre-line text-base leading-relaxed text-ink-muted">
					{view.description}
				</p>
			{/if}
		</div>

		{#if cancelled}
			<!-- No date, no distribution - just the organizer's call, spelled out. -->
			<div class="rounded-xl border border-border bg-card px-4 py-3.5">
				<p class="text-[15px] leading-relaxed text-ink-muted">{m.cancelledMessage()}</p>
			</div>
		{:else if decided}
			<!-- The outcome, front and center: the chosen date(s)... -->
			<div
				in:fly={{ y: 8, duration: 240, easing: cubicOut }}
				class="rounded-xl border border-primary bg-primary-tint px-4 py-3.5"
			>
				<div class="flex items-center gap-2 text-sm font-bold text-primary">
					<CalendarCheck size={16} class="shrink-0" />
					{chosenDates.length > 1 ? m.chosenDatesHeading() : m.chosenDateHeading()}
				</div>
				<div class="mt-1.5 flex flex-col gap-1">
					{#each chosenDates as d (d.id)}
						<div class="text-xl font-extrabold capitalize tracking-[-0.01em] text-ink">
							{d.weekday}
							{d.dateLabel}{#if d.timeRange}
								<span class="text-base font-semibold text-ink-muted">· {d.timeRange}</span>{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- ...then how everyone answered, counts only - names stay with the organizer. -->
			<div class="mt-8 flex flex-col gap-3.5">
				<SectionHeading text={m.distributionHeading()} />
				{#each view.dates as d, i (d.id)}
					{@const o = outcomeById.get(d.id)}
					{#if o}
						<div
							in:fly={{ y: 8, duration: 240, delay: i * 40, easing: cubicOut }}
							class="rounded-xl border bg-card p-4 {o.chosen ? 'border-primary' : 'border-border'}"
						>
							<div class="flex flex-wrap items-center gap-2.5">
								<div>
									<div class="text-[15px] font-bold capitalize text-ink">{d.weekday}</div>
									<div class="text-[13px] text-ink-muted">
										{d.dateLabel}{#if d.timeRange}
											· {d.timeRange}{/if}
									</div>
								</div>
								{#if o.chosen}
									<span
										class="whitespace-nowrap rounded-full bg-primary-tint px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] text-primary"
									>
										{m.chosenBadge()}
									</span>
								{/if}
							</div>
							<div class="mt-4">
								<ResultBars
									preferred={o.preferred}
									available={o.available}
									unavailable={o.unavailable}
									preferredPct={o.preferredPct}
									availablePct={o.availablePct}
									unavailablePct={o.unavailablePct}
								/>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{:else}
			<div class="flex flex-col gap-5">
				{#if mode === 'open'}
					<TextField label={m.namePrompt()} name="name" bind:value={name} placeholder={m.name()} />
				{/if}
				<p class="text-[17px] font-semibold text-ink">{m.responseIntro()}</p>

				<div class="flex flex-col gap-3.5">
					<SectionHeading text={m.datesQuestion()} />
					{#if hasNewDates && !closed}
						<div
							class="flex items-center gap-2.5 rounded-xl border border-primary bg-primary-tint px-4 py-3 text-sm font-semibold text-primary"
						>
							<span class="h-2 w-2 shrink-0 rounded-full bg-primary"></span>
							{m.newDatesBanner()}
						</div>
					{/if}
					{#each view.dates as d, i (d.id)}
						<DateOptionCard
							id={d.id}
							weekday={d.weekday}
							dateLabel={d.dateLabel}
							timeRange={d.timeRange}
							index={i}
							bind:value={answers[d.id]}
							readOnly={closed}
							isNew={d.needsAnswer ?? false}
						/>
					{/each}
				</div>

				<div class="mt-1.5 flex flex-col gap-2">
					<TextArea
						label={m.noteLabel()}
						name="note"
						bind:value={note}
						placeholder={m.notePlaceholder()}
						disabled={closed}
					/>
				</div>
			</div>
		{/if}

		{#if !closed}
			<div
				class="fixed inset-x-0 bottom-0 z-[80] flex justify-center border-t border-border bg-paper px-5 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3.5"
			>
				<div class="w-full max-w-[480px]">
					{#if submitted}
						<div class="flex flex-col gap-3">
							<div class="flex items-center gap-3">
								<div
									class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-good-tint text-good"
								>
									<Check size={18} />
								</div>
								<div class="flex min-w-0 flex-1 flex-col gap-0.5">
									<div class="text-[15px] font-bold text-ink">{m.savedTitle()}</div>
									<div class="text-[13px] leading-snug text-ink-muted">{m.savedSub()}</div>
								</div>
								<button
									type="button"
									onclick={() => {
										submitted = false;
									}}
									class="shrink-0 cursor-pointer border-none bg-transparent p-2 text-[13px] font-semibold text-primary"
								>
									{m.editAnswer()}
								</button>
							</div>
							{#if editUrl}
								<div class="rounded-xl border border-border bg-card-alt px-3.5 py-3">
									<div class="text-[13px] font-semibold text-ink">{m.editLinkTitle()}</div>
									<p class="mt-1 text-[13px] leading-relaxed text-ink-muted">{m.editLinkHint()}</p>
									<CopyLinkRow
										url={editUrl}
										oncopied={() => {
											toast.show(m.linkCopied());
										}}
										class="mt-2"
									/>
								</div>
							{/if}
						</div>
					{:else}
						<div class="flex flex-col gap-1.5">
							{#if !allAnswered}
								<div class="text-center text-xs text-ink-muted">{m.chooseEach()}</div>
							{/if}
							<button
								type="submit"
								disabled={!allAnswered}
								class="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] text-base font-bold transition-colors duration-150 {allAnswered
									? 'cursor-pointer bg-primary text-white'
									: 'cursor-default bg-border text-ink-muted'}"
							>
								<Send size={18} />
								{m.sendAnswer()}
							</button>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</form>

	<Toast open={toast.open} text={toast.text} />
{/if}
