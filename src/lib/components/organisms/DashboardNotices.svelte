<script lang="ts">
	import Callout from '$lib/components/molecules/Callout.svelte';
	import CopyLinkRow from '$lib/components/molecules/CopyLinkRow.svelte';
	import NoticeBanner from '$lib/components/atoms/NoticeBanner.svelte';
	import { TriangleAlert, Lock } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import LocaleSwap from '$lib/components/atoms/LocaleSwap.svelte';
	import {
		isTextPollType,
		type EventStatus,
		type InviteeView,
		type Locale,
		type PollMode,
		type PollType
	} from '$lib/types';

	// Everything between the header and the results: share link, save-your-link
	// warning, closed/cancelled status, and the chase-up list for partial answers.
	let {
		pollMode,
		status,
		shareUrl,
		organizerUrl,
		chosenDates,
		pollType = 'dates',
		partials,
		locale,
		oncopied
	}: {
		pollMode: PollMode;
		status: EventStatus;
		shareUrl: string;
		organizerUrl: string;
		chosenDates: { weekday: string; dateLabel: string; timeRange: string; label: string }[];
		pollType?: PollType;
		partials: InviteeView[];
		locale: Locale;
		oncopied: () => void;
	} = $props();

	const question = $derived(isTextPollType(pollType));
	const rsvp = $derived(pollType === 'rsvp');
</script>

<LocaleSwap {locale}>
	{#if pollMode === 'open'}
		<!-- The link to hand out. Kept at the top and visually primary so it's clearly
		     the one to share - the organizer /e link below is private. -->
		<Callout tone="ink" title={m.shareLinkTitle()} class="mb-4">
			<p class="mt-1.5 text-caption leading-relaxed text-ink">{m.shareLinkHint()}</p>
			<CopyLinkRow url={shareUrl} {oncopied} class="mt-2.5" />
		</Callout>
	{/if}

	<!-- Save-your-link warning: the /e URL is the only way back to the results and
	     is private - never the link to share (open mode has its own above). -->
	<Callout tone="hl" title={m.organizerLinkTitle()} class="mb-6">
		{#snippet icon()}<TriangleAlert size={16} class="shrink-0" />{/snippet}
		<p class="mt-1.5 text-caption leading-relaxed text-ink">{m.organizerLinkWarning()}</p>
		<CopyLinkRow url={organizerUrl} {oncopied} class="mt-2.5" />
	</Callout>

	{#if status === 'cancelled'}
		<NoticeBanner text={m.cancelledBanner()} class="mb-6" />
	{:else if status === 'closed'}
		{#if chosenDates.length > 0}
			<!-- The decision, front and center: closed + the chosen option(s). -->
			<Callout
				tone="ink"
				title={rsvp
					? m.confirmedHeadingRsvp()
					: question
						? chosenDates.length > 1
							? m.chosenOptionsHeading()
							: m.chosenOptionHeading()
						: chosenDates.length > 1
							? m.chosenDatesHeading()
							: m.chosenDateHeading()}
				class="mb-6"
			>
				{#snippet icon()}<Lock size={16} class="shrink-0" />{/snippet}
				<div class="mt-1.5 flex flex-col gap-0.5">
					{#each chosenDates as d (d.label + d.dateLabel + d.timeRange)}
						{#if d.label}
							<div class="text-body font-bold text-ink">{d.label}</div>
						{:else}
							<div class="text-body font-bold capitalize text-ink">
								{d.weekday}
								{d.dateLabel}{#if d.timeRange}
									<span class="font-semibold text-ink-muted">· {d.timeRange}</span>{/if}
							</div>
						{/if}
					{/each}
				</div>
				<!-- Share the result with the group: reuses the minted share_token,
				     which /s now serves as a read-only outcome in any mode. -->
				<p class="mt-3 text-caption leading-relaxed text-ink">{m.shareResultHint()}</p>
				<CopyLinkRow url={`${shareUrl}?ref=result`} {oncopied} class="mt-2" />
			</Callout>
		{:else}
			<!-- Poll closed before decisions existed: plain closed notice. -->
			<NoticeBanner text={m.closedBanner()} class="mb-6" />
		{/if}
	{/if}

	<!-- Chase-up callout: participants who answered before more dates were added,
	     with their personal links ready to resend. Covers open mode too - this is
	     the only place open-mode /r links surface for the organizer. -->
	{#if partials.length > 0}
		<Callout
			tone="dashed"
			title={question ? m.needsUpdateTitleQuestion() : m.needsUpdateTitle()}
			class="mb-6"
		>
			<p class="mt-1.5 text-caption leading-relaxed text-ink">
				{question ? m.needsUpdateHintQuestion() : m.needsUpdateHint()}
			</p>
			<div class="mt-2.5 flex flex-col gap-2.5">
				{#each partials as p (p.id)}
					<!-- Name above its link row: the row never fights the name for width
					     on a narrow screen. -->
					<div class="flex flex-col gap-1">
						<span class="min-w-0 break-words text-body font-semibold text-ink">{p.label}</span>
						<CopyLinkRow url={p.url} {oncopied} />
					</div>
				{/each}
			</div>
		</Callout>
	{/if}
</LocaleSwap>
