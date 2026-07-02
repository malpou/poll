<script lang="ts">
	import Callout from '$lib/components/molecules/Callout.svelte';
	import CopyLinkRow from '$lib/components/molecules/CopyLinkRow.svelte';
	import NoticeBanner from '$lib/components/atoms/NoticeBanner.svelte';
	import { TriangleAlert, Lock } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import type { EventStatus, InviteeView, Locale, PollMode } from '$lib/types';

	// Everything between the header and the results: share link, save-your-link
	// warning, closed/cancelled status, and the chase-up list for partial answers.
	let {
		pollMode,
		status,
		shareUrl,
		organizerUrl,
		chosenDates,
		partials,
		locale,
		oncopied
	}: {
		pollMode: PollMode;
		status: EventStatus;
		shareUrl: string;
		organizerUrl: string;
		chosenDates: { weekday: string; dateLabel: string; timeRange: string }[];
		partials: InviteeView[];
		locale: Locale;
		oncopied: () => void;
	} = $props();
</script>

{#key locale}
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
			<!-- The decision, front and center: closed + the chosen date(s). -->
			<Callout
				tone="ink"
				title={chosenDates.length > 1 ? m.chosenDatesHeading() : m.chosenDateHeading()}
				class="mb-6"
			>
				{#snippet icon()}<Lock size={16} class="shrink-0" />{/snippet}
				<div class="mt-1.5 flex flex-col gap-0.5">
					{#each chosenDates as d (d.dateLabel + d.timeRange)}
						<div class="text-body font-bold capitalize text-ink">
							{d.weekday}
							{d.dateLabel}{#if d.timeRange}
								<span class="font-semibold text-ink-muted">· {d.timeRange}</span>{/if}
						</div>
					{/each}
				</div>
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
		<Callout tone="dashed" title={m.needsUpdateTitle()} class="mb-6">
			<p class="mt-1.5 text-caption leading-relaxed text-ink">{m.needsUpdateHint()}</p>
			<div class="mt-2.5 flex flex-col gap-2">
				{#each partials as p (p.id)}
					<div class="flex flex-wrap items-center gap-2.5">
						<span class="min-w-20 text-body font-semibold text-ink">{p.label}</span>
						<CopyLinkRow url={p.url} {oncopied} class="flex-1" />
					</div>
				{/each}
			</div>
		</Callout>
	{/if}
{/key}
