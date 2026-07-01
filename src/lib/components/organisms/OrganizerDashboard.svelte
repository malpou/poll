<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { enhance } from '$app/forms';
	import TextField from '$lib/components/atoms/TextField.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import IconButton from '$lib/components/atoms/IconButton.svelte';
	import LinkChip from '$lib/components/atoms/LinkChip.svelte';
	import Toast from '$lib/components/atoms/Toast.svelte';
	import { da } from '$lib/da';

	interface OptionView {
		id: string;
		value: string;
		startTime: string;
		endTime: string;
		hasResponses: boolean;
		weekday: string;
		dateLabel: string;
		timeRange: string;
	}
	interface ResultView {
		id: string;
		preferred: number;
		available: number;
		unavailable: number;
		preferredPct: number;
		availablePct: number;
		unavailablePct: number;
		preferredNames: string[];
		availableNames: string[];
		unavailableNames: string[];
		answeredLabel: string;
		isBest: boolean;
		weekday: string;
		dateLabel: string;
		timeRange: string;
	}
	interface InviteeView {
		id: string;
		label: string;
		url: string;
		answered: boolean;
		note: string | null;
	}
	interface ValidData {
		invalid: false;
		token: string;
		organizerUrl: string;
		title: string;
		description: string | null;
		closed: boolean;
		results: ResultView[];
		options: OptionView[];
		invitees: InviteeView[];
	}

	let { data }: { data: { invalid: true } | ValidData } = $props();
	const view = $derived<ValidData | null>(data.invalid ? null : data);

	// Which option is in inline-edit mode (id) — null when none.
	let editing = $state<string | null>(null);

	// Expanded result cards (show who chose what) and expanded invitee notes.
	let expandedResults = $state<Record<string, boolean>>({});
	let expandedNotes = $state<Record<string, boolean>>({});

	// Results bars grow from 0 to their width once mounted (DESIGN.md: animate
	// width on mount, ~450ms ease-out). Reduced-motion → straight to full width.
	const reduced =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	let revealed = $state(reduced);
	onMount(() => {
		if (!revealed) requestAnimationFrame(() => (revealed = true));
	});

	let toastOpen = $state(false);
	let toastTimer: ReturnType<typeof setTimeout> | undefined;

	function copy(url: string) {
		void navigator.clipboard.writeText(url).catch(() => undefined);
		clearTimeout(toastTimer);
		toastOpen = true;
		toastTimer = setTimeout(() => (toastOpen = false), 3000);
	}

	type AfterSubmit = (a: {
		result: { type: string };
		update: () => Promise<void>;
	}) => Promise<void>;

	// After a successful submit, re-run the load so the list reflects the change.
	const onResult: AfterSubmit = ({ result, update }) => {
		if (result.type === 'success') editing = null;
		return update();
	};

	// enhance factory: re-run load on success.
	function refresh() {
		return onResult;
	}

	// enhance factory: warn first when deleting something with responses. cancel()
	// aborts the submit cleanly — done in the SubmitFunction (not onsubmit) so it
	// cooperates with enhance's own preventDefault.
	function confirmingRefresh(message: string, needsConfirm: boolean) {
		return ({ cancel }: { cancel: () => void }): AfterSubmit | undefined => {
			if (needsConfirm && !confirm(message)) {
				cancel();
				return undefined;
			}
			return onResult;
		};
	}
</script>

{#if !view}
	<div class="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-10 text-center">
		<div class="h-[52px] w-[52px] rotate-45 rounded-[14px] border border-border bg-card-alt"></div>
		<h1 class="mt-3 text-2xl font-extrabold tracking-[-0.01em] text-ink">{da.linkNotFound}</h1>
		<p class="max-w-[300px] text-[15px] leading-relaxed text-ink-muted">{da.linkNotFoundSub}</p>
	</div>
{:else}
	<div class="mx-auto max-w-[640px] px-6 pb-24 pt-10">
		<div class="mb-8 flex items-start justify-between gap-4">
			<div class="min-w-0">
				<div class="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
					{da.dashboardTitle}
				</div>
				<h1 class="mt-1 text-[28px] font-extrabold tracking-[-0.02em] text-ink">{view.title}</h1>
				{#if view.description}
					<p class="mt-1.5 text-[15px] leading-relaxed text-ink-muted">{view.description}</p>
				{/if}
			</div>
			<form method="POST" action={view.closed ? '?/reopen' : '?/close'} use:enhance={refresh}>
				<Button variant="ghost" type="submit">
					{view.closed ? da.reopenPoll : da.closePoll}
				</Button>
			</form>
		</div>

		<!-- Save-your-link warning: the /e URL is the only way back to the results. -->
		<div class="mb-6 rounded-xl border border-amber bg-amber-tint px-4 py-3.5">
			<div class="flex items-center gap-2 text-sm font-bold text-amber">
				<span class="text-base leading-none">⚠</span>
				{da.organizerLinkTitle}
			</div>
			<p class="mt-1.5 text-[13px] leading-relaxed text-ink">{da.organizerLinkWarning}</p>
			<div class="mt-2.5 flex flex-wrap items-center gap-2.5">
				<LinkChip text={view.organizerUrl.replace(/^https?:\/\//, '')} />
				<Button
					variant="ghost"
					onclick={() => {
						copy(view.organizerUrl);
					}}>{da.copyLink}</Button
				>
			</div>
		</div>

		{#if view.closed}
			<div
				class="mb-6 flex items-center gap-2.5 rounded-xl border border-border bg-amber-tint px-4 py-3 text-sm font-semibold text-amber"
			>
				<span class="h-2 w-2 shrink-0 rounded-full bg-amber"></span>
				{da.closedBanner}
			</div>
		{/if}

		<!-- Results -->
		{#if view.results.length > 0}
			<section class="mb-10">
				<div class="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
					{da.resultsSection}
				</div>
				<div class="flex flex-col gap-3">
					{#each view.results as r, i (r.id)}
						<div
							in:fly={{ y: 8, duration: 240, delay: i * 40, easing: cubicOut }}
							class="rounded-xl border border-border bg-card p-4"
						>
							<div class="flex flex-wrap items-center justify-between gap-2.5">
								<div class="flex items-center gap-2.5">
									<div>
										<div class="text-[15px] font-bold capitalize text-ink">{r.weekday}</div>
										<div class="text-[13px] text-ink-muted">
											{r.dateLabel}{#if r.timeRange}
												· {r.timeRange}{/if}
										</div>
									</div>
									{#if r.isBest}
										<span
											class="whitespace-nowrap rounded-full bg-amber-tint px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] text-amber"
										>
											{da.bestDate}
										</span>
									{/if}
								</div>
								<div class="flex items-center gap-2">
									<div class="whitespace-nowrap text-[13px] font-semibold text-ink-muted">
										{r.answeredLabel}
									</div>
									{#if r.preferred + r.available + r.unavailable > 0}
										<IconButton
											label={expandedResults[r.id] ? da.hideWho : da.showWho}
											onclick={() => (expandedResults[r.id] = !expandedResults[r.id])}
										>
											{expandedResults[r.id] ? '▲' : '▾'}
										</IconButton>
									{/if}
								</div>
							</div>

							<div class="mt-4 flex flex-col gap-2">
								{#each [{ label: da.prefPreferred, count: r.preferred, pct: r.preferredPct, color: 'bg-amber', names: r.preferredNames }, { label: da.prefAvailable, count: r.available, pct: r.availablePct, color: 'bg-good', names: r.availableNames }, { label: da.prefUnavailable, count: r.unavailable, pct: r.unavailablePct, color: 'bg-bad', names: r.unavailableNames }] as bar (bar.label)}
									<div class="grid grid-cols-[92px_1fr_22px] items-center gap-2.5">
										<div class="text-xs font-semibold text-ink-muted">{bar.label}</div>
										<div class="h-2.5 overflow-hidden rounded-md bg-card-alt">
											<div
												class="h-full rounded-md {bar.color}"
												style="width:{revealed ? bar.pct : 0}%; transition:{reduced
													? 'none'
													: 'width 450ms cubic-bezier(0.16,1,0.3,1)'};"
											></div>
										</div>
										<div class="text-right text-xs font-bold text-ink">{bar.count}</div>
									</div>
									{#if expandedResults[r.id] && bar.names.length > 0}
										<div class="pl-[102px] text-[13px] text-ink-muted">
											{bar.names.join(', ')}
										</div>
									{/if}
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Options -->
		<section class="mb-10">
			<div class="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
				{da.datesSection}
			</div>
			<div class="flex flex-col gap-2.5">
				{#each view.options as opt, i (opt.id)}
					<div
						in:fly={{ y: 8, duration: 240, delay: i * 40, easing: cubicOut }}
						class="rounded-xl border border-border bg-card p-3"
					>
						{#if editing === opt.id}
							<form
								method="POST"
								action="?/editOption"
								use:enhance={refresh}
								class="flex flex-col gap-2.5"
							>
								<input type="hidden" name="optionId" value={opt.id} />
								<div class="flex items-center gap-2.5">
									<TextField type="date" name="value" value={opt.value} />
									<Button variant="ghost" type="submit">{da.save}</Button>
									<IconButton
										label={da.remove}
										onclick={() => {
											editing = null;
										}}>✕</IconButton
									>
								</div>
								<div class="flex items-center gap-3.5">
									<div class="flex flex-1 items-center gap-2">
										<span class="shrink-0 text-xs font-semibold text-ink-muted">{da.from}</span>
										<TextField type="time" compact name="startTime" value={opt.startTime} />
									</div>
									<div class="flex flex-1 items-center gap-2">
										<span class="shrink-0 text-xs font-semibold text-ink-muted">{da.to}</span>
										<TextField type="time" compact name="endTime" value={opt.endTime} />
									</div>
								</div>
							</form>
						{:else}
							<div class="flex items-center justify-between gap-2.5">
								<div class="min-w-0">
									<div class="text-[15px] font-semibold text-ink">
										{opt.weekday}
										{opt.dateLabel}
									</div>
									{#if opt.timeRange}
										<div class="text-[13px] text-ink-muted">{opt.timeRange}</div>
									{/if}
								</div>
								{#if !view.closed}
									<div class="flex shrink-0 items-center gap-2">
										<Button
											variant="ghost"
											onclick={() => {
												editing = opt.id;
											}}>{da.edit}</Button
										>
										<form
											method="POST"
											action="?/removeOption"
											use:enhance={confirmingRefresh(da.confirmDeleteOption, opt.hasResponses)}
										>
											<input type="hidden" name="optionId" value={opt.id} />
											<IconButton label={da.remove} type="submit">✕</IconButton>
										</form>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>

			{#if !view.closed}
				<form method="POST" action="?/addOption" use:enhance={refresh} class="mt-2.5">
					<div class="rounded-xl border border-dashed border-border bg-card p-3">
						<div class="flex items-center gap-2.5">
							<!-- value="" makes the native picker start empty each render. -->
							<TextField type="date" name="value" value="" />
							<Button variant="ghost" type="submit">{da.addDate}</Button>
						</div>
						<div class="mt-2.5 flex items-center gap-3.5">
							<div class="flex flex-1 items-center gap-2">
								<span class="shrink-0 text-xs font-semibold text-ink-muted">{da.from}</span>
								<TextField type="time" compact name="startTime" value="" />
							</div>
							<div class="flex flex-1 items-center gap-2">
								<span class="shrink-0 text-xs font-semibold text-ink-muted">{da.to}</span>
								<TextField type="time" compact name="endTime" value="" />
							</div>
						</div>
					</div>
				</form>
			{/if}
		</section>

		<!-- Invitees -->
		<section>
			<div class="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
				{da.participantsSection}
			</div>
			<div class="flex flex-col gap-2.5">
				{#each view.invitees as inv, i (inv.id)}
					<div
						in:fly={{ y: 8, duration: 240, delay: i * 40, easing: cubicOut }}
						class="rounded-xl border border-border bg-card p-3"
					>
						<div class="flex items-center gap-2.5">
							{#if view.closed}
								<div class="flex-1 text-[15px] font-semibold text-ink">{inv.label}</div>
							{:else}
								<form
									method="POST"
									action="?/renameInvitee"
									use:enhance={refresh}
									class="flex flex-1 items-center gap-2.5"
								>
									<input type="hidden" name="inviteeId" value={inv.id} />
									<TextField name="label" value={inv.label} />
									<Button variant="ghost" type="submit">{da.save}</Button>
								</form>
							{/if}
							<span
								class="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold {inv.answered
									? 'bg-good-tint text-good'
									: 'bg-amber-tint text-amber'}"
							>
								{inv.answered ? da.answered : da.pending}
							</span>
							{#if inv.note}
								<IconButton
									label={expandedNotes[inv.id] ? da.hideNote : da.showNote}
									onclick={() => (expandedNotes[inv.id] = !expandedNotes[inv.id])}
								>
									💬
								</IconButton>
							{/if}
							{#if !view.closed}
								<form
									method="POST"
									action="?/removeInvitee"
									use:enhance={confirmingRefresh(da.confirmDeleteInvitee, true)}
								>
									<input type="hidden" name="inviteeId" value={inv.id} />
									<IconButton label={da.remove} type="submit">✕</IconButton>
								</form>
							{/if}
						</div>
						{#if inv.note && expandedNotes[inv.id]}
							<div
								class="mt-2.5 rounded-lg bg-card-alt px-3 py-2 text-[13px] leading-relaxed text-ink-muted"
							>
								{inv.note}
							</div>
						{/if}
						<div class="mt-2.5 flex flex-wrap items-center gap-2.5">
							<LinkChip text={inv.url.replace(/^https?:\/\//, '')} />
							<Button
								variant="ghost"
								onclick={() => {
									copy(inv.url);
								}}>{da.copyLink}</Button
							>
						</div>
					</div>
				{/each}
			</div>

			{#if !view.closed}
				<form method="POST" action="?/addInvitee" use:enhance={refresh} class="mt-2.5">
					<div class="rounded-xl border border-dashed border-border bg-card p-3">
						<div class="flex items-center gap-2.5">
							<TextField placeholder={da.name} name="label" value="" />
							<Button variant="ghost" type="submit">{da.addParticipant}</Button>
						</div>
					</div>
				</form>
			{/if}
		</section>
	</div>

	<Toast open={toastOpen} text={da.linkCopied} />
{/if}
