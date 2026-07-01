<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import DateOptionCard from '$lib/components/molecules/DateOptionCard.svelte';
	import TextArea from '$lib/components/atoms/TextArea.svelte';
	import Toast from '$lib/components/atoms/Toast.svelte';
	import { da } from '$lib/da';
	import type { Preference } from '$lib/types';

	interface CardData {
		id: string;
		weekday: string;
		dateLabel: string;
		timeRange: string;
	}
	interface ValidData {
		invalid: false;
		closed: boolean;
		name: string;
		title: string;
		description: string | null;
		dates: CardData[];
		answers: Record<string, Preference>;
		note: string;
	}

	let {
		data
	}: {
		data: { invalid: true } | ValidData;
	} = $props();

	// Narrowed view for the template - avoids re-checking the union per binding.
	const view = $derived<ValidData | null>(data.invalid ? null : data);

	// Local editable state, seeded once from the load (revisits pre-select).
	// data only changes on navigation, which remounts this component.
	const seed = untrack(() => (data.invalid ? null : data));
	let answers = $state<Record<string, Preference | undefined>>({ ...(seed?.answers ?? {}) });
	let note = $state(seed?.note ?? '');
	let submitted = $state(Object.keys(seed?.answers ?? {}).length > 0);
	let toastOpen = $state(false);
	let toastTimer: ReturnType<typeof setTimeout> | undefined;

	const allAnswered = $derived(
		!!view && view.dates.length > 0 && view.dates.every((d) => answers[d.id] !== undefined)
	);

	function onSubmitted() {
		submitted = true;
		clearTimeout(toastTimer);
		toastOpen = true;
		toastTimer = setTimeout(() => (toastOpen = false), 3000);
	}
</script>

{#if !view}
	<div class="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-10 text-center">
		<div class="h-[52px] w-[52px] rotate-45 rounded-[14px] border border-border bg-card-alt"></div>
		<h1 class="mt-3 text-2xl font-extrabold tracking-[-0.01em] text-ink">{da.linkNotFound}</h1>
		<p class="max-w-[300px] text-[15px] leading-relaxed text-ink-muted">{da.linkNotFoundSub}</p>
	</div>
{:else}
	<form
		method="POST"
		action="?/save"
		use:enhance={() =>
			({ result, update }) => {
				if (result.type === 'success') onSubmitted();
				return update({ reset: false });
			}}
		class="mx-auto max-w-[480px] px-5 pb-32 pt-8"
	>
		{#if view.closed}
			<div
				class="mb-[22px] flex items-center gap-2.5 rounded-xl border border-border bg-amber-tint px-4 py-3 text-sm font-semibold text-amber"
			>
				<span class="h-2 w-2 shrink-0 rounded-full bg-amber"></span>
				{da.closedBanner}
			</div>
		{/if}

		<div class="mb-[30px] flex flex-col gap-1.5">
			<div class="text-[15px] font-semibold text-primary">{da.greeting} {view.name}</div>
			<h1 class="text-[30px] font-extrabold tracking-[-0.02em] text-ink">{view.title}</h1>
			{#if view.description}
				<p class="mt-1.5 text-base leading-relaxed text-ink-muted">{view.description}</p>
			{/if}
		</div>

		<div class="flex flex-col gap-5">
			<p class="text-[17px] font-semibold text-ink">{da.responseIntro}</p>

			<div class="flex flex-col gap-3.5">
				<div class="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
					{da.datesQuestion}
				</div>
				{#each view.dates as d, i (d.id)}
					<DateOptionCard
						id={d.id}
						weekday={d.weekday}
						dateLabel={d.dateLabel}
						timeRange={d.timeRange}
						index={i}
						bind:value={answers[d.id]}
						readOnly={view.closed}
					/>
				{/each}
			</div>

			<div class="mt-1.5 flex flex-col gap-2">
				<TextArea
					label={da.noteLabel}
					name="note"
					bind:value={note}
					placeholder={da.notePlaceholder}
					disabled={view.closed}
				/>
			</div>
		</div>

		{#if !view.closed}
			<div
				class="fixed inset-x-0 bottom-0 z-[80] flex justify-center border-t border-border bg-paper px-5 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3.5"
			>
				<div class="w-full max-w-[480px]">
					{#if submitted}
						<div class="flex items-center gap-3">
							<div
								class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-good-tint text-[17px] font-bold text-good"
							>
								✓
							</div>
							<div class="flex min-w-0 flex-1 flex-col gap-0.5">
								<div class="text-[15px] font-bold text-ink">{da.savedTitle}</div>
								<div class="text-[13px] leading-snug text-ink-muted">{da.savedSub}</div>
							</div>
							<button
								type="button"
								onclick={() => {
									submitted = false;
								}}
								class="shrink-0 cursor-pointer border-none bg-transparent p-2 text-[13px] font-semibold text-primary"
							>
								{da.editAnswer}
							</button>
						</div>
					{:else}
						<div class="flex flex-col gap-1.5">
							{#if !allAnswered}
								<div class="text-center text-xs text-ink-muted">{da.chooseEach}</div>
							{/if}
							<button
								type="submit"
								disabled={!allAnswered}
								class="h-[52px] w-full rounded-[14px] text-base font-bold transition-colors duration-150 {allAnswered
									? 'cursor-pointer bg-primary text-white'
									: 'cursor-default bg-border text-ink-muted'}"
							>
								{da.sendAnswer}
							</button>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</form>

	<Toast open={toastOpen} text={da.savedTitle} />
{/if}
