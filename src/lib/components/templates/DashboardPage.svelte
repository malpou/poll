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
	import type {
		EventStatus,
		InviteeView,
		Locale,
		OptionView,
		PollMode,
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
		pollMode: PollMode;
		status: EventStatus;
		chosenDates: { weekday: string; dateLabel: string; timeRange: string }[];
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

	// Live language preview (same trick as the create page): picking a language
	// in the edit form flips <html lang> - which m.*() reads - and this state,
	// which every organism keys its markup on. Saving persists it; cancelling
	// calls back with the stored locale to roll back.
	// svelte-ignore state_referenced_locally
	let uiLocale = $state<Locale>(view?.locale ?? 'da');
	function previewLocale(next: Locale) {
		if (browser) document.documentElement.lang = next;
		uiLocale = next;
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
	<div class="mx-auto max-w-160 px-6 pb-24 pt-10">
		<EventHeader
			title={view.title}
			description={view.description}
			pollMode={view.pollMode}
			eventLocale={view.locale}
			locale={uiLocale}
			{closed}
			bind:selecting
			onpreviewlocale={previewLocale}
		/>

		<DashboardNotices
			pollMode={view.pollMode}
			status={view.status}
			shareUrl={view.shareUrl}
			organizerUrl={view.organizerUrl}
			chosenDates={view.chosenDates}
			{partials}
			locale={uiLocale}
			oncopied={copied}
		/>

		<ResultsSection
			results={view.results}
			respondedLabel={view.respondedLabel}
			{closed}
			bind:selecting
			locale={uiLocale}
		/>

		<OptionsSection options={view.options} {closed} locale={uiLocale} />

		<InviteesSection
			invitees={view.invitees}
			pollMode={view.pollMode}
			{closed}
			locale={uiLocale}
			oncopied={copied}
		/>
	</div>

	<Toast open={toast.open} text={toast.text} />
{/if}
