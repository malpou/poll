<script lang="ts">
	import { enhance } from '$app/forms';
	import TextField from '$lib/components/atoms/TextField.svelte';
	import RichTextEditor from '$lib/components/atoms/RichTextEditor.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import IconButton from '$lib/components/atoms/IconButton.svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import SelectField from '$lib/components/atoms/SelectField.svelte';
	import { X, Pencil, Check, Lock, LockOpen, Users, Languages, Clock } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import { locales, langLabel } from '$lib/logic/locales';
	import { refreshThen } from '$lib/forms/enhance';
	import { isRichText, toEditorHtml } from '$lib/forms/richtext';
	import type { Locale, PollMode } from '$lib/types';

	let {
		title,
		description,
		pollMode,
		eventLocale,
		locale,
		timezone,
		closed,
		selecting = $bindable(),
		onpreviewlocale
	}: {
		title: string;
		description: string | null;
		pollMode: PollMode;
		// The poll's saved language (shown/edited) vs the page's current preview
		// language (drives the {#key} re-render below).
		eventLocale: Locale;
		locale: Locale;
		timezone: string;
		closed: boolean;
		selecting: boolean;
		onpreviewlocale: (l: Locale) => void;
	} = $props();

	const zones = Intl.supportedValuesOf('timeZone');

	/**
	 * Plain-text labels for the non-edit header. Keyed by the poll's stored values.
	 */
	const localeLabel = (l: Locale) => langLabel(l, locale);
	const modeLabel = (mo: PollMode) => (mo === 'open' ? m.modeOpen() : m.modeAssigned());

	// Title/description inline-edit toggle. Drafts live here (not on the DOM) so
	// the {#key locale} re-render for a language preview keeps what was typed.
	let editingDetails = $state(false);
	let draftTitle = $state('');
	let draftDescription = $state('');
	let draftMode = $state<PollMode>('assigned'); // re-seeded by startEdit()

	function startEdit() {
		draftTitle = title;
		// Legacy plain-text descriptions become paragraphs so line breaks survive.
		draftDescription = toEditorHtml(description ?? '');
		draftMode = pollMode;
		editingDetails = true;
	}
	function cancelEdit() {
		editingDetails = false;
		onpreviewlocale(eventLocale); // roll back an unsaved language preview
	}
</script>

{#key locale}
	<div class="mb-8">
		<SectionHeading text={m.dashboardTitle()} />

		<!-- Title + description own their block; the edit button sits below, not
		     beside the (wrapping) title, so nothing collides. -->
		{#if editingDetails}
			<form
				method="POST"
				action="?/saveDetails"
				use:enhance={refreshThen(() => (editingDetails = false))}
				class="mt-2 flex flex-col gap-2.5"
			>
				<TextField label={m.fieldTitle()} name="title" bind:value={draftTitle} />
				<RichTextEditor
					label={m.fieldDescription()}
					name="description"
					bind:value={draftDescription}
				/>
				<!-- Language + mode edited alongside title/description; saved together. -->
				<SelectField label={m.fieldMode()} name="pollMode" value={draftMode}>
					<option value="assigned">{m.modeAssigned()}</option>
					<option value="open">{m.modeOpen()}</option>
				</SelectField>
				<!-- Picking a language previews the whole dashboard immediately; saving
				     persists it, cancelling rolls it back. Same live switch as /. -->
				<SelectField
					label={m.fieldLanguage()}
					name="locale"
					value={locale}
					onchange={(v) => onpreviewlocale(v as Locale)}
				>
					{#each locales as l (l)}
						<option value={l}>{langLabel(l, locale)}</option>
					{/each}
				</SelectField>
				<!-- Saving re-renders every option's times in the new zone; no live
				     preview since times are server-rendered. -->
				<SelectField label={m.fieldTimezone()} name="timezone" value={timezone}>
					{#each zones as tz (tz)}
						<option value={tz}>{tz}</option>
					{/each}
				</SelectField>
				<div class="flex items-center gap-2.5">
					<Button variant="ghost" type="submit" iconOnly label={m.save()}
						><Check size={16} /></Button
					>
					<IconButton label={m.cancel()} onclick={cancelEdit}><X size={16} /></IconButton>
				</div>
			</form>
		{:else}
			<h1 class="mt-1 text-title font-extrabold tracking-[-0.02em] text-ink">{title}</h1>
			{#if description}
				{#if isRichText(description)}
					<!-- Editor HTML, sanitized to the allowed subset at write time. -->
					<div class="rich-text mt-1.5 text-body leading-relaxed text-ink-muted">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html description}
					</div>
				{:else}
					<p class="mt-1.5 whitespace-pre-line text-body leading-relaxed text-ink-muted">
						{description}
					</p>
				{/if}
			{/if}
			<!-- Icons stand in for the field labels; sr-only text keeps them readable. -->
			<ul class="mt-2 space-y-1 text-caption text-ink-muted">
				<li class="flex items-center gap-1.5">
					<Users size={14} aria-hidden="true" />
					<span class="sr-only">{m.fieldMode()}:</span>
					<span class="font-semibold text-ink">{modeLabel(pollMode)}</span>
				</li>
				<li class="flex items-center gap-1.5">
					<Languages size={14} aria-hidden="true" />
					<span class="sr-only">{m.fieldLanguage()}:</span>
					<span class="font-semibold text-ink">{localeLabel(eventLocale)}</span>
				</li>
				<li class="flex items-center gap-1.5">
					<Clock size={14} aria-hidden="true" />
					<span class="sr-only">{m.fieldTimezone()}:</span>
					<span class="font-semibold text-ink">{timezone}</span>
				</li>
			</ul>
		{/if}

		<!-- One controls row: edit on the left, the lock control (close/reopen)
		     pushed right. Closing means deciding: the button enters a selection
		     mode on the results cards; confirm/cancel/back live under the
		     results section. -->
		<div class="mt-3 flex flex-wrap items-center gap-2.5">
			{#if !editingDetails && !closed}
				<Button variant="ghost" onclick={startEdit}><Pencil size={14} />{m.edit()}</Button>
			{/if}
			<span class="ml-auto">
				{#if closed}
					<form method="POST" action="?/reopen" use:enhance={refreshThen()}>
						<Button variant="ghost" type="submit">
							<LockOpen size={14} />{m.reopenPoll()}
						</Button>
					</form>
				{:else if !selecting}
					<Button
						variant="ghost"
						onclick={() => {
							selecting = true;
						}}
					>
						<Lock size={14} />{m.closePoll()}
					</Button>
				{/if}
			</span>
		</div>
	</div>
{/key}
