<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { enhance } from '$app/forms';
	import TextField from '$lib/components/atoms/TextField.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import IconButton from '$lib/components/atoms/IconButton.svelte';
	import LinkChip from '$lib/components/atoms/LinkChip.svelte';
	import Toast from '$lib/components/feedback/Toast.svelte';
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
	interface InviteeView {
		id: string;
		label: string;
		url: string;
	}
	interface ValidData {
		invalid: false;
		token: string;
		title: string;
		description: string | null;
		closed: boolean;
		options: OptionView[];
		invitees: InviteeView[];
	}

	let { data }: { data: { invalid: true } | ValidData } = $props();
	const view = $derived<ValidData | null>(data.invalid ? null : data);

	// Which option is in inline-edit mode (id) — null when none.
	let editing = $state<string | null>(null);

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

		{#if view.closed}
			<div
				class="mb-6 flex items-center gap-2.5 rounded-xl border border-border bg-amber-tint px-4 py-3 text-sm font-semibold text-amber"
			>
				<span class="h-2 w-2 shrink-0 rounded-full bg-amber"></span>
				{da.closedBanner}
			</div>
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
