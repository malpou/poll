<script lang="ts">
	import TextField from '$lib/components/atoms/TextField.svelte';
	import RichTextEditor from '$lib/components/atoms/RichTextEditor.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import TimezoneCombobox from '$lib/components/atoms/TimezoneCombobox.svelte';
	import { ArrowRight, X } from '@lucide/svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import CalendarDatePicker from '$lib/components/molecules/CalendarDatePicker.svelte';
	import TextOptionList from '$lib/components/molecules/TextOptionList.svelte';
	import ParticipantList from '$lib/components/organisms/ParticipantList.svelte';
	import Toast from '$lib/components/atoms/Toast.svelte';
	import { createToast } from '$lib/components/atoms/create-toast.svelte';
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';
	import { replaceState } from '$app/navigation';
	import { createUrl } from '$lib/logic/site-urls';
	import { langLabel } from '$lib/logic/locales';
	import { m } from '$lib/paraglide/messages';
	import { helpers } from '$lib/data/shared';
	import AccentPicker from '$lib/components/atoms/AccentPicker.svelte';
	import LanguagePicker from '$lib/components/atoms/LanguagePicker.svelte';
	import type { Accent, DateOption, Locale, Participant, PollMode, PollType } from '$lib/types';

	// The create action's fail() payload; null on first render / success.
	// suggestedLocale/suggestedAccent seed the pickers from the page URL (the
	// language segment and the ?accent= the landing page carried over).
	let {
		form,
		suggestedLocale,
		suggestedAccent = 'yellow',
		hintLocale = null
	}: {
		form: { error?: string } | null;
		suggestedLocale: Locale;
		suggestedAccent?: Accent;
		// Browser-preferred language when it differs from the form's: offered as
		// a dismissible hint, never a redirect.
		hintLocale?: Locale | null;
	} = $props();

	// Start empty; dates and participants are added via the same fill-then-add
	// cards the dashboard uses.
	let title = $state('');
	let description = $state('');
	// Seed once from the browser-suggested locale; the picker owns it afterwards.
	// svelte-ignore state_referenced_locally
	let locale = $state<Locale>(suggestedLocale);
	// 'assigned': organizer names everyone up front (one link each). 'open': one
	// shared link, anyone submits their own name. Default keeps the current flow.
	let pollMode = $state<PollMode>('assigned');
	// Choice toggles: yes/no are always offered; these two are optional.
	let allowPreferred = $state(true);
	let allowUnsure = $state(false);
	// The poll's highlighter; data-accent on the form previews it live.
	// svelte-ignore state_referenced_locally
	let accent = $state<Accent>(suggestedAccent);
	// Immutable after creation: dates polls pick candidate dates, question polls
	// carry free-form text options, RSVP polls carry exactly one date. Each list
	// survives a type switch pre-submit; only the picked type's rows are
	// mounted, so only those post.
	let pollType = $state<PollType>('dates');
	let dates = $state<DateOption[]>([]);
	let rsvpDates = $state<DateOption[]>([]);
	let textOptions = $state<{ id: string; text: string }[]>([]);
	let participants = $state<Participant[]>([]);

	// Timezone every option's times are read in. Defaults to the visitor's own
	// zone; SSR computes the server's, hydration replaces it with the browser's.
	// State lives outside {#key locale} so a language preview keeps the choice.
	const zones = Intl.supportedValuesOf('timeZone');
	const guess = new Intl.DateTimeFormat().resolvedOptions().timeZone;
	let timezone = $state(zones.includes(guess) ? guess : 'Europe/Copenhagen');

	const toast = createToast();

	function addParticipant(name: string) {
		participants.push({ ...helpers.blankParticipant(), name });
	}
	function removeParticipant(id: string) {
		participants = participants.filter((p) => p.id !== id);
	}

	/**
	 * Live language switch: m.*() reads getLocale(), which on the client returns
	 * <html lang> (see +layout.svelte). Updates <html lang> synchronously the moment
	 * the picker changes - before the {#key locale} block re-renders and re-reads
	 * it - so the whole form re-renders in the new language with no page refresh.
	 */
	function pickLocale(next: Locale) {
		if (browser) {
			document.documentElement.lang = next;
			// Keep the URL on the picked language's create route (shallow - no
			// reload, the {#key locale} re-render does the work).
			replaceState(createUrl(next, accent), {});
		}
		locale = next;
	}

	// The highlighter pick syncs the ?accent= query the same way, so the
	// landing-page choice and a reload both keep it.
	function pickAccent(next: Accent) {
		if (browser) replaceState(createUrl(locale, next), {});
	}

	// The hint is dismissible for the session (same key as the landing page's
	// hint: one dismissal quiets the offer everywhere). Hidden during SSR so a
	// dismissal never flashes.
	let hintDismissed = $derived(!browser || sessionStorage.getItem('langHintDismissed') === '1');
	function dismissHint() {
		sessionStorage.setItem('langHintDismissed', '1');
		hintDismissed = true;
	}
</script>

<svelte:head>
	{#key locale}
		<title>{m.createTitle()} · {m.appName()}</title>
	{/key}
</svelte:head>

<form
	method="POST"
	action="?/create"
	use:enhance
	data-accent={accent}
	class="mx-auto max-w-160 px-4 pb-18 pt-7"
>
	{#if hintLocale && hintLocale !== locale && !hintDismissed}
		{@const hl = hintLocale}
		<div
			data-testid="lang-hint"
			class="mb-4 flex items-center gap-2.5 rounded-card border-2 border-border bg-card-alt px-4 py-3 text-sm font-semibold text-ink"
		>
			<span class="h-2 w-2 shrink-0 rounded-full bg-ink"></span>
			<!-- Written in the browser's language; picking it flips the poll-language
			     picker in place - the same live switch, no navigation. -->
			<button
				type="button"
				onclick={() => pickLocale(hl)}
				class="cursor-pointer text-left underline hover:no-underline"
			>
				{m.createHintUse({ language: langLabel(hl, hl) }, { locale: hl })}
			</button>
			<button
				type="button"
				onclick={dismissHint}
				aria-label={m.landingHintDismiss({}, { locale: hl })}
				class="ml-auto cursor-pointer text-ink-muted transition-colors duration-150 hover:text-ink"
			>
				<X size={16} aria-hidden="true" />
			</button>
		</div>
	{/if}
	<div class="paper-sheet">
		<!-- Corner pickers: accent top-left, language top-right, pinned to the
	     edges at every width; each swatch row wraps onto multiple rows on
	     narrow phones rather than the two stacking. Both are legend-less. The
	     accent picker keeps its own {#key} so its swatch labels re-translate on
	     a language switch (the language picker owns the key and stays put). -->
		<div class="mb-6 flex items-start justify-between gap-12">
			{#key locale}
				<AccentPicker bind:value={accent} showLegend={false} onpick={pickAccent} />
			{/key}
			<LanguagePicker bind:value={locale} onpick={pickLocale} showLegend={false} alignEnd />
		</div>

		<!-- Re-render every m.*() under the newly picked locale. Form state (title,
	     dates, participants) lives in $state above the block, so it survives. -->
		{#key locale}
			<h1 class="mb-3 text-title font-bold text-ink">
				<span class="hl-swipe">{m.createTitle()}</span>
			</h1>
			<p class="mb-8 max-w-prose text-body leading-relaxed text-ink-muted">
				{pollType === 'question'
					? m.createIntroQuestion()
					: pollType === 'rsvp'
						? m.createIntroRsvp()
						: m.createIntro()}
			</p>

			<!-- The type decides what the rest of the form asks for, so it leads. -->
			<fieldset class="mb-9 flex flex-col gap-2.5">
				<legend class="mb-3 text-2xs font-bold uppercase tracking-widest text-ink-muted">
					{m.fieldPollType()}
				</legend>
				{#each [{ value: 'dates', label: m.pollTypeDates() }, { value: 'question', label: m.pollTypeQuestion() }, { value: 'rsvp', label: m.pollTypeRsvp() }] as opt (opt.value)}
					{@const active = pollType === opt.value}
					<label
						class="relative flex cursor-pointer items-center gap-3 rounded-control border-2 p-3.5 text-body text-ink transition hover:border-ink {active
							? 'border-ink bg-hl-tint'
							: 'border-border-strong bg-card-alt'}"
					>
						<input
							type="radio"
							name="pollType"
							value={opt.value}
							bind:group={pollType}
							class="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
						/>
						<span class="grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 border-ink">
							<span class="h-2 w-2 rounded-full {active ? 'bg-ink' : ''}"></span>
						</span>
						{opt.label}
					</label>
				{/each}
				<p class="text-caption leading-relaxed text-ink-muted">
					{pollType === 'question'
						? m.pollTypeQuestionHint()
						: pollType === 'rsvp'
							? m.pollTypeRsvpHint()
							: m.pollTypeDatesHint()}
				</p>
			</fieldset>

			<div class="mb-6">
				<TextField
					label={m.fieldTitle()}
					name="title"
					bind:value={title}
					placeholder={m.titlePlaceholder()}
				/>
			</div>

			<div class="mb-10">
				<RichTextEditor label={m.fieldDescription()} name="description" bind:value={description} />
			</div>

			{#if pollType === 'question'}
				<div class="mb-10">
					<SectionHeading text={m.optionsSection()} class="mb-1" />
					<p class="mb-3.5 text-caption text-ink-muted">{m.optionsHint()}</p>
					<TextOptionList bind:options={textOptions} />
				</div>
			{:else if pollType === 'rsvp'}
				<div class="mb-10">
					<SectionHeading text={m.dateSectionRsvp()} class="mb-1" />
					<p class="mb-3.5 text-caption text-ink-muted">{m.dateHintRsvp()}</p>
					<CalendarDatePicker bind:dates={rsvpDates} {locale} single />
				</div>

				<div class="mb-9">
					<TimezoneCombobox name="timezone" bind:value={timezone} {locale} />
				</div>
			{:else}
				<div class="mb-10">
					<SectionHeading text={m.datesSection()} class="mb-1" />
					<p class="mb-3.5 text-caption text-ink-muted">{m.datesHint()}</p>
					<CalendarDatePicker bind:dates {locale} />
				</div>

				<div class="mb-9">
					<TimezoneCombobox name="timezone" bind:value={timezone} {locale} />
				</div>
			{/if}

			<fieldset class="mb-9 flex flex-col gap-2.5">
				<legend class="mb-3 text-2xs font-bold uppercase tracking-widest text-ink-muted">
					{m.fieldMode()}
				</legend>
				{#each [{ value: 'assigned', label: m.modeAssigned() }, { value: 'open', label: m.modeOpen() }] as opt (opt.value)}
					{@const active = pollMode === opt.value}
					<label
						class="relative flex cursor-pointer items-center gap-3 rounded-control border-2 p-3.5 text-body text-ink transition hover:border-ink {active
							? 'border-ink bg-hl-tint'
							: 'border-border-strong bg-card-alt'}"
					>
						<input
							type="radio"
							name="pollMode"
							value={opt.value}
							bind:group={pollMode}
							class="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
						/>
						<span class="grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 border-ink">
							<span class="h-2 w-2 rounded-full {active ? 'bg-ink' : ''}"></span>
						</span>
						{opt.label}
					</label>
				{/each}
				<p class="text-caption leading-relaxed text-ink-muted">
					{pollMode === 'open' ? m.modeOpenHint() : m.modeAssignedHint()}
				</p>
			</fieldset>

			{#if pollMode === 'assigned'}
				<div class="mb-9">
					<ParticipantList
						bind:participants
						onadd={addParticipant}
						onremove={removeParticipant}
						oncopied={() => toast.show(m.linkCopied())}
					/>
				</div>
			{/if}

			<!-- Hidden inputs carry explicit values so the server never has to guess
		     an unchecked box's meaning (allowPreferred defaults on). RSVP is
		     strictly yes/no: no toggles offered, both posted off. -->
			{#if pollType === 'rsvp'}
				<input type="hidden" name="allowPreferred" value="0" />
				<input type="hidden" name="allowUnsure" value="0" />
			{:else}
				<div class="mb-9 flex flex-col gap-2">
					<span class="text-2xs font-bold uppercase tracking-widest text-ink-muted"
						>{m.fieldChoices()}</span
					>
					<label class="flex items-center gap-2 text-body text-ink">
						<input
							type="checkbox"
							bind:checked={allowPreferred}
							class="h-5 w-5 cursor-pointer accent-ink"
						/>
						{m.prefPreferred()}
					</label>
					<label class="flex items-center gap-2 text-body text-ink">
						<input
							type="checkbox"
							bind:checked={allowUnsure}
							class="h-5 w-5 cursor-pointer accent-ink"
						/>
						{m.prefUnsure()}
					</label>
					<p class="text-caption leading-relaxed text-ink-muted">{m.choicesHint()}</p>
					<input type="hidden" name="allowPreferred" value={allowPreferred ? '1' : '0'} />
					<input type="hidden" name="allowUnsure" value={allowUnsure ? '1' : '0'} />
				</div>
			{/if}

			<div class="mt-2 flex flex-col gap-3.5">
				{#if form?.error}
					<div class="text-sm font-semibold text-bad">{form.error}</div>
				{/if}
				<Button variant="primary" type="submit">{m.create()}<ArrowRight size={17} /></Button>
			</div>
		{/key}
	</div>
</form>

<Toast open={toast.open} text={toast.text} />
