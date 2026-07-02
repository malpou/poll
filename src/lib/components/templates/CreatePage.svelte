<script lang="ts">
	import TextField from '$lib/components/atoms/TextField.svelte';
	import RichTextEditor from '$lib/components/atoms/RichTextEditor.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import SelectField from '$lib/components/atoms/SelectField.svelte';
	import { Check } from '@lucide/svelte';
	import DateList from '$lib/components/organisms/DateList.svelte';
	import ParticipantList from '$lib/components/organisms/ParticipantList.svelte';
	import Toast from '$lib/components/atoms/Toast.svelte';
	import { createToast } from '$lib/components/atoms/create-toast.svelte';
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';
	import { m } from '$lib/paraglide/messages';
	import { locales, langLabel } from '$lib/logic/locales';
	import { helpers } from '$lib/data/shared';
	import type { DateOption, Locale, Participant, PollMode } from '$lib/types';

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
	let dates = $state<DateOption[]>([]);
	let participants = $state<Participant[]>([]);

	// Timezone every option's times are read in. Defaults to the visitor's own
	// zone; SSR computes the server's, hydration replaces it with the browser's.
	const zones = Intl.supportedValuesOf('timeZone');
	const guess = new Intl.DateTimeFormat().resolvedOptions().timeZone;
	const tzDefault = zones.includes(guess) ? guess : 'Europe/Copenhagen';

	const toast = createToast();

	function addDate(d: Omit<DateOption, 'id'>) {
		dates.push({ ...helpers.blankDate(), ...d });
	}
	function removeDate(id: string) {
		dates = dates.filter((d) => d.id !== id);
	}
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

<form method="POST" action="?/create" use:enhance class="mx-auto max-w-160 px-6 pb-24 pt-10">
	<!-- Language picker sits outside {#key} so re-rendering the form on switch
	     doesn't steal focus from the <select>. Its own labels re-key with the rest. -->
	<label class="mb-10 flex flex-col gap-2">
		<span class="text-sm font-semibold text-ink"
			>{#key locale}{m.fieldLanguage()}{/key}</span
		>
		<select
			id="locale"
			name="locale"
			value={locale}
			onchange={(e) => {
				pickLocale(e.currentTarget.value as Locale);
			}}
			class="h-11.5 w-full rounded-control border border-border bg-card px-3.5 text-body text-ink outline-none focus:border-primary"
		>
			{#each locales as l (l)}
				<option value={l}>{langLabel(l, locale)}</option>
			{/each}
		</select>
	</label>

	<!-- Re-render every m.*() under the newly picked locale. Form state (title,
	     dates, participants) lives in $state above the block, so it survives. -->
	{#key locale}
		<h1 class="mb-3 text-title font-extrabold tracking-[-0.02em] text-ink">
			{m.createTitle()}
		</h1>
		<p class="mb-8 max-w-[52ch] text-body leading-relaxed text-ink-muted">
			{m.createIntro()}
		</p>

		<div class="mb-6">
			<TextField label={m.fieldTitle()} name="title" bind:value={title} />
		</div>

		<div class="mb-10">
			<RichTextEditor label={m.fieldDescription()} name="description" bind:value={description} />
		</div>

		<div class="mb-10">
			<DateList bind:dates onadd={addDate} onremove={removeDate} />
		</div>

		<div class="mb-9">
			<SelectField label={m.fieldTimezone()} name="timezone" value={tzDefault}>
				{#each zones as tz (tz)}
					<option value={tz}>{tz}</option>
				{/each}
			</SelectField>
		</div>

		<div class="mb-9 flex flex-col gap-2">
			<SelectField
				label={m.fieldMode()}
				name="pollMode"
				value={pollMode}
				onchange={(v) => {
					pollMode = v as PollMode;
				}}
			>
				<option value="assigned">{m.modeAssigned()}</option>
				<option value="open">{m.modeOpen()}</option>
			</SelectField>
			<p class="text-caption leading-relaxed text-ink-muted">
				{pollMode === 'open' ? m.modeOpenHint() : m.modeAssignedHint()}
			</p>
		</div>

		<!-- Hidden inputs carry explicit values so the server never has to guess
		     an unchecked box's meaning (allowPreferred defaults on). -->
		<div class="mb-9 flex flex-col gap-2">
			<span class="text-sm font-semibold text-ink">{m.fieldChoices()}</span>
			<label class="flex items-center gap-2 text-body text-ink">
				<input
					type="checkbox"
					bind:checked={allowPreferred}
					class="h-5 w-5 cursor-pointer accent-[var(--color-primary,#1B3A7B)]"
				/>
				{m.prefPreferred()}
			</label>
			<label class="flex items-center gap-2 text-body text-ink">
				<input
					type="checkbox"
					bind:checked={allowUnsure}
					class="h-5 w-5 cursor-pointer accent-[var(--color-primary,#1B3A7B)]"
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

		<div class="mt-2 flex items-center gap-3.5">
			<Button variant="primary" type="submit"><Check size={18} />{m.create()}</Button>
			{#if form?.error}
				<div class="text-sm font-semibold text-bad">{form.error}</div>
			{/if}
		</div>
	{/key}
</form>

<Toast open={toast.open} text={toast.text} />
