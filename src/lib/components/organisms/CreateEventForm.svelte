<script lang="ts">
	import TextField from '$lib/components/atoms/TextField.svelte';
	import TextArea from '$lib/components/atoms/TextArea.svelte';
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
	import { helpers } from '$lib/data/shared';
	import type { DateOption, Locale, Participant, PollMode } from '$lib/types';

	// The create action's fail() payload; null on first render / success.
	// suggestedLocale seeds the picker from the visitor's Accept-Language.
	let { form, suggestedLocale }: { form: { error?: string } | null; suggestedLocale: Locale } =
		$props();

	// Start empty - one blank row each so the form is usable without seed data.
	let title = $state('');
	let description = $state('');
	// Seed once from the browser-suggested locale; the picker owns it afterwards.
	// svelte-ignore state_referenced_locally
	let locale = $state<Locale>(suggestedLocale);
	// 'assigned': organizer names everyone up front (one link each). 'open': one
	// shared link, anyone submits their own name. Default keeps the current flow.
	let pollMode = $state<PollMode>('assigned');
	let dates = $state<DateOption[]>([helpers.blankDate()]);
	let participants = $state<Participant[]>([helpers.blankParticipant()]);

	const toast = createToast();

	function addDate() {
		dates.push(helpers.blankDate());
	}
	function removeDate(id: string) {
		dates = dates.filter((d) => d.id !== id);
	}
	function addParticipant() {
		participants.push(helpers.blankParticipant());
	}
	function removeParticipant(id: string) {
		participants = participants.filter((p) => p.id !== id);
	}

	// Live language switch: m.*() reads getLocale(), which on the client returns
	// <html lang> (see +layout.svelte). Update <html lang> synchronously the moment
	// the picker changes - before the {#key locale} block re-renders and re-reads
	// it - so the whole form re-renders in the new language with no page refresh.
	function pickLocale(next: Locale) {
		if (browser) document.documentElement.lang = next;
		locale = next;
	}
</script>

<form method="POST" action="?/create" use:enhance class="mx-auto max-w-[640px] px-6 pb-24 pt-10">
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
			class="h-[46px] w-full rounded-[10px] border border-border bg-card px-3.5 text-[15px] text-ink outline-none focus:border-primary"
		>
			<option value="da">{m.langDa()}</option>
			<option value="en">{m.langEn()}</option>
			<option value="fr">{m.langFr()}</option>
		</select>
	</label>

	<!-- Re-render every m.*() under the newly picked locale. Form state (title,
	     dates, participants) lives in $state above the block, so it survives. -->
	{#key locale}
		<h1 class="mb-3 text-[28px] font-extrabold tracking-[-0.02em] text-ink">
			{m.createTitle()}
		</h1>
		<p class="mb-8 max-w-[52ch] text-[15px] leading-relaxed text-ink-muted">
			{m.createIntro()}
		</p>

		<div class="mb-6">
			<TextField label={m.fieldTitle()} name="title" bind:value={title} />
		</div>

		<div class="mb-10">
			<TextArea label={m.fieldDescription()} name="description" bind:value={description} />
		</div>

		<div class="mb-10">
			<DateList bind:dates onadd={addDate} onremove={removeDate} />
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
			<p class="text-[13px] leading-relaxed text-ink-muted">
				{pollMode === 'open' ? m.modeOpenHint() : m.modeAssignedHint()}
			</p>
		</div>

		{#if pollMode === 'assigned'}
			<div class="mb-9">
				<ParticipantList
					bind:participants
					onadd={addParticipant}
					onremove={removeParticipant}
					oncopied={() => {
						toast.show(m.linkCopied());
					}}
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
