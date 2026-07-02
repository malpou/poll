<script lang="ts">
	import { browser } from '$app/environment';
	import Toast from '$lib/components/atoms/Toast.svelte';
	import { createToast } from '$lib/components/atoms/create-toast.svelte';
	import LinkNotFound from '$lib/components/molecules/LinkNotFound.svelte';
	import EventHeader from '$lib/components/organisms/EventHeader.svelte';
	import DashboardNotices from '$lib/components/organisms/DashboardNotices.svelte';
	import ResultsSection from '$lib/components/organisms/ResultsSection.svelte';
	import OptionsSection from '$lib/components/organisms/OptionsSection.svelte';
	import InviteesSection from '$lib/components/organisms/InviteesSection.svelte';
	import { m } from '$lib/paraglide/messages';
	import { baseLocale } from '$lib/paraglide/runtime';
	import type {
		Accent,
		EventStatus,
		InviteeView,
		Locale,
		OptionView,
		PollMode,
		PollType,
		ResultView
	} from '$lib/types';

	interface ValidData {
		invalid: false;
		token: string;
		organizerUrl: string;
		shareUrl: string;
		title: string;
		description: string | null;
		locale: Locale;
		timezone: string;
		pollMode: PollMode;
		allowPreferred: boolean;
		allowUnsure: boolean;
		accent: Accent;
		status: EventStatus;
		pollType: PollType;
		chosenDates: { weekday: string; dateLabel: string; timeRange: string; label: string }[];
		respondedLabel: string;
		results: ResultView[];
		options: OptionView[];
		invitees: InviteeView[];
	}

	let { data }: { data: { invalid: true } | ValidData } = $props();
	const view = $derived<ValidData | null>(data.invalid ? null : data);

	// Closed and cancelled polls share the read-only dashboard affordances.
	const closed = $derived(!!view && view.status !== 'open');

	// 'partial' = answered before more dates were added. Surfaced in a callout
	// with their links so the organizer can chase the missing answers. Closed
	// polls hide it - nobody can respond anyway.
	const partials = $derived(
		view && !closed ? view.invitees.filter((i) => i.status === 'partial') : []
	);

	// RSVP headcount: who hasn't answered yet. Only assigned mode has a fixed
	// roster to count against; open mode shows counts only.
	const pendingNames = $derived(
		view?.pollType === 'rsvp' && view.pollMode === 'assigned'
			? view.invitees.filter((i) => i.status === 'none').map((i) => i.label)
			: []
	);

	// Live language preview (same trick as the create page): picking a language
	// in the edit form flips <html lang> - which m.*() reads - and this state,
	// which every organism keys its markup on. Saving persists it; cancelling
	// calls back with the stored locale to roll back.
	// svelte-ignore state_referenced_locally
	let uiLocale = $state<Locale>(view?.locale ?? baseLocale);
	function previewLocale(next: Locale) {
		if (browser) document.documentElement.lang = next;
		uiLocale = next;
	}

	// Live accent preview, same trick: the picker updates the page's data-accent
	// immediately; saving persists it, cancelling rolls it back.
	// svelte-ignore state_referenced_locally
	let uiAccent = $state<Accent>(view?.accent ?? 'yellow');
	function previewAccent(next: Accent) {
		uiAccent = next;
	}

	// Selection mode for closing the poll spans the header (entry button) and
	// the results section (checkboxes + confirm), so it lives here.
	let selecting = $state(false);

	const toast = createToast();
	const copied = () => {
		toast.show(m.linkCopied());
	};
</script>

{#if !view}
	<LinkNotFound />
{:else}
	<div data-accent={uiAccent} class="mx-auto max-w-160 px-4 pb-18 pt-7">
		<div class="paper-sheet">
			<EventHeader
				title={view.title}
				description={view.description}
				pollMode={view.pollMode}
				allowPreferred={view.allowPreferred}
				allowUnsure={view.allowUnsure}
				accent={view.accent}
				eventLocale={view.locale}
				locale={uiLocale}
				timezone={view.timezone}
				pollType={view.pollType}
				{closed}
				bind:selecting
				onpreviewlocale={previewLocale}
				onpreviewaccent={previewAccent}
			/>

			<DashboardNotices
				pollMode={view.pollMode}
				status={view.status}
				shareUrl={view.shareUrl}
				organizerUrl={view.organizerUrl}
				chosenDates={view.chosenDates}
				pollType={view.pollType}
				{partials}
				locale={uiLocale}
				oncopied={copied}
			/>

			<div class="my-8 border-t-2 border-dashed border-border-strong"></div>

			<ResultsSection
				results={view.results}
				respondedLabel={view.respondedLabel}
				allowPreferred={view.allowPreferred}
				allowUnsure={view.allowUnsure}
				pollType={view.pollType}
				{pendingNames}
				{closed}
				bind:selecting
				locale={uiLocale}
			/>

			<OptionsSection options={view.options} pollType={view.pollType} {closed} locale={uiLocale} />

			<div class="my-8 border-t-2 border-dashed border-border-strong"></div>

			<InviteesSection
				invitees={view.invitees}
				pollMode={view.pollMode}
				{closed}
				locale={uiLocale}
				pollType={view.pollType}
				oncopied={copied}
			/>
		</div>
	</div>

	<Toast open={toast.open} text={toast.text} />
{/if}
