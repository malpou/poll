<script lang="ts">
	import { enhance } from '$app/forms';
	import TextField from '$lib/components/atoms/TextField.svelte';
	import TextArea from '$lib/components/atoms/TextArea.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import IconButton from '$lib/components/atoms/IconButton.svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import SelectField from '$lib/components/atoms/SelectField.svelte';
	import { X, Pencil, Check, Lock, LockOpen } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import { refreshThen } from '$lib/forms/enhance';
	import type { Locale, PollMode } from '$lib/types';

	let {
		title,
		description,
		pollMode,
		eventLocale,
		locale,
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
		closed: boolean;
		selecting: boolean;
		onpreviewlocale: (l: Locale) => void;
	} = $props();

	/**
	 * Plain-text labels for the non-edit header. Keyed by the poll's stored values.
	 */
	const localeLabel = (l: Locale) => ({ da: m.langDa(), en: m.langEn(), fr: m.langFr() })[l];
	const modeLabel = (mo: PollMode) => (mo === 'open' ? m.modeOpen() : m.modeAssigned());

	// Title/description inline-edit toggle. Drafts live here (not on the DOM) so
	// the {#key locale} re-render for a language preview keeps what was typed.
	let editingDetails = $state(false);
	let draftTitle = $state('');
	let draftDescription = $state('');
	let draftMode = $state<PollMode>('assigned'); // re-seeded by startEdit()

	function startEdit() {
		draftTitle = title;
		draftDescription = description ?? '';
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
				<TextArea label={m.fieldDescription()} name="description" bind:value={draftDescription} />
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
					<option value="da">{m.langDa()}</option>
					<option value="en">{m.langEn()}</option>
					<option value="fr">{m.langFr()}</option>
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
				<p class="mt-1.5 whitespace-pre-line text-body leading-relaxed text-ink-muted">
					{description}
				</p>
			{/if}
			<div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink-muted">
				<span
					>{m.fieldMode()}:
					<span class="font-semibold text-ink">{modeLabel(pollMode)}</span></span
				>
				<span
					>{m.fieldLanguage()}:
					<span class="font-semibold text-ink">{localeLabel(eventLocale)}</span></span
				>
			</div>
			{#if !closed}
				<div class="mt-3">
					<Button variant="ghost" onclick={startEdit}><Pencil size={14} />{m.edit()}</Button>
				</div>
			{/if}
		{/if}

		<!-- Poll controls on their own row, under the title/description. Closing
		     means deciding: the button enters a selection mode on the results
		     cards; confirm/cancel/back live under the results section. -->
		<div class="mt-5 flex flex-wrap items-center gap-2.5">
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
		</div>
	</div>
{/key}
