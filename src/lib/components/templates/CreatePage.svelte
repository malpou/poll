<script lang="ts">
	import TextField from '$lib/components/atoms/TextField.svelte';
	import RichTextEditor from '$lib/components/atoms/RichTextEditor.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import TimezoneCombobox from '$lib/components/atoms/TimezoneCombobox.svelte';
	import { ArrowRight } from '@lucide/svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import CalendarDatePicker from '$lib/components/molecules/CalendarDatePicker.svelte';
	import ParticipantList from '$lib/components/organisms/ParticipantList.svelte';
	import Toast from '$lib/components/atoms/Toast.svelte';
	import { createToast } from '$lib/components/atoms/create-toast.svelte';
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';
	import { m } from '$lib/paraglide/messages';
	import { helpers } from '$lib/data/shared';
	import AccentPicker from '$lib/components/atoms/AccentPicker.svelte';
	import LanguagePicker from '$lib/components/atoms/LanguagePicker.svelte';
	import type { Accent, DateOption, Locale, Participant, PollMode } from '$lib/types';

	// The create action's fail() payload; null on first render / success.
	// suggestedLocale seeds the picker from the visitor's Accept-Language.
	let { form, suggestedLocale }: { form: { error?: string } | null; suggestedLocale: Locale } =
		$props();

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
	let accent = $state<Accent>('yellow');
	let dates = $state<DateOption[]>([]);
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
		if (browser) document.documentElement.lang = next;
		locale = next;
	}
</script>

<form
	method="POST"
	action="?/create"
	use:enhance
	data-accent={accent}
	class="mx-auto max-w-160 px-4 pb-18 pt-7"
>
	<div class="paper-sheet">
		<!-- Corner pickers: accent top-left, language top-right; stacked and
	     centered on phones. Both are legend-less swatch rows. The accent
	     picker keeps its own {#key} so its swatch labels re-translate on a
	     language switch (the language picker owns the key and stays put). -->
		<div
			class="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between"
		>
			{#key locale}
				<AccentPicker bind:value={accent} showLegend={false} />
			{/key}
			<LanguagePicker bind:value={locale} onpick={pickLocale} showLegend={false} />
		</div>

		<!-- Re-render every m.*() under the newly picked locale. Form state (title,
	     dates, participants) lives in $state above the block, so it survives. -->
		{#key locale}
			<h1 class="mb-3 text-title font-bold text-ink">
				<span class="hl-swipe">{m.createTitle()}</span>
			</h1>
			<p class="mb-8 max-w-prose text-body leading-relaxed text-ink-muted">
				{m.createIntro()}
			</p>

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

			<div class="mb-10">
				<SectionHeading text={m.datesSection()} class="mb-1" />
				<p class="mb-3.5 text-caption text-ink-muted">{m.datesHint()}</p>
				<CalendarDatePicker bind:dates {locale} />
			</div>

			<div class="mb-9">
				<TimezoneCombobox name="timezone" bind:value={timezone} {locale} />
			</div>

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

			<!-- Hidden inputs carry explicit values so the server never has to guess
		     an unchecked box's meaning (allowPreferred defaults on). -->
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
