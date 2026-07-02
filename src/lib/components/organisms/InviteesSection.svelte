<script lang="ts">
	import { fly } from 'svelte/transition';
	import { flyIn } from '$lib/motion';
	import { enhance } from '$app/forms';
	import TextField from '$lib/components/atoms/TextField.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import IconButton from '$lib/components/atoms/IconButton.svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import CopyLinkRow from '$lib/components/molecules/CopyLinkRow.svelte';
	import AddParticipantForm from '$lib/components/molecules/AddParticipantForm.svelte';
	import { X, MessageSquare, Pencil, Save } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import { refreshThen, confirmingRefresh } from '$lib/forms/enhance';
	import type { InviteeView, Locale, PollMode, PollType } from '$lib/types';

	let {
		invitees,
		pollMode,
		closed,
		locale,
		pollType = 'dates',
		oncopied
	}: {
		invitees: InviteeView[];
		pollMode: PollMode;
		closed: boolean;
		locale: Locale;
		pollType?: PollType;
		oncopied: () => void;
	} = $props();

	/**
	 * Builds the status pill's CSS classes and label for an invitee.
	 * The partial state gets its own copy; both incomplete states carry the
	 * poll's highlighter tint.
	 */
	const statusPill = (s: InviteeView['status']) =>
		s === 'complete'
			? { cls: 'bg-good-tint text-good', text: m.answered() }
			: {
					cls: 'bg-hl-tint text-ink',
					text:
						s === 'partial'
							? pollType === 'question'
								? m.partialAnsweredQuestion()
								: m.partialAnswered()
							: m.pending()
				};

	// Expanded invitee notes.
	let expandedNotes = $state<Record<string, boolean>>({});

	// Which invitee's name is being renamed (id) - null when none; names are
	// read-only until the pencil is clicked.
	let renaming = $state<string | null>(null);
	const closeRename = refreshThen(() => (renaming = null));
</script>

{#snippet noteToggle(inv: InviteeView)}
	{#if inv.note}
		<IconButton
			label={expandedNotes[inv.id] ? m.hideNote() : m.showNote()}
			onclick={() => (expandedNotes[inv.id] = !expandedNotes[inv.id])}
		>
			<MessageSquare size={16} />
		</IconButton>
	{/if}
{/snippet}

{#snippet noteBody(inv: InviteeView)}
	{#if inv.note && expandedNotes[inv.id]}
		<div
			class="mt-2.5 rounded-control bg-card-alt px-3 py-2 text-caption leading-relaxed text-ink-muted"
		>
			{inv.note}
		</div>
	{/if}
{/snippet}

{#key locale}
	<section>
		<SectionHeading text={m.participantsSection()} class="mb-3.5" />

		{#if pollMode === 'open'}
			<!-- Open mode: the shared link lives at the top. Respondents are listed
			     read-only (names come from submissions), each with their personal
			     link so the organizer can hand it back if lost. -->
			{#if invitees.length > 0}
				<div class="flex flex-col gap-2.5">
					{#each invitees as inv, i (inv.id)}
						<div in:fly={flyIn(i)} class="rounded-card border-2 border-border bg-card-alt p-3">
							<div class="flex items-center gap-2.5">
								<div class="min-w-0 flex-1 break-words text-body font-semibold text-ink">
									{inv.label}
								</div>
								{@render noteToggle(inv)}
							</div>
							{@render noteBody(inv)}
							<CopyLinkRow url={inv.url} {oncopied} class="mt-2.5" />
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-caption leading-relaxed text-ink-muted">{m.shareLinkHint()}</p>
			{/if}
		{:else}
			<div class="flex flex-col gap-2.5">
				{#each invitees as inv, i (inv.id)}
					<div in:fly={flyIn(i)} class="rounded-card border-2 border-border bg-card-alt p-3">
						{#if !closed && renaming === inv.id}
							<!-- The rename form takes the whole header row - the pill and the
							     other controls step aside so the field has room to type in. -->
							<form
								method="POST"
								action="?/renameInvitee"
								use:enhance={closeRename}
								class="flex items-center gap-2.5"
							>
								<input type="hidden" name="inviteeId" value={inv.id} />
								<TextField name="label" value={inv.label} />
								<Button variant="ghost" type="submit" iconOnly label={m.save()}
									><Save size={16} /></Button
								>
								<IconButton
									label={m.cancel()}
									onclick={() => {
										renaming = null;
									}}><X size={16} /></IconButton
								>
							</form>
						{:else}
							<!-- Name first; the controls cluster wraps onto its own row on a
							     narrow screen instead of squeezing the name into a column. -->
							<div class="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
								<div class="min-w-0 flex-1 basis-40 break-words text-body font-semibold text-ink">
									{inv.label}
								</div>
								<div class="ml-auto flex shrink-0 items-center gap-2">
									{#if !closed}
										<Button
											variant="ghost"
											iconOnly
											label={m.edit()}
											onclick={() => {
												renaming = inv.id;
											}}><Pencil size={16} /></Button
										>
									{/if}
									<span
										class="whitespace-nowrap rounded-full px-2.5 py-1 text-2xs font-bold {statusPill(
											inv.status
										).cls}"
									>
										{statusPill(inv.status).text}
									</span>
									{@render noteToggle(inv)}
									{#if !closed}
										<form
											method="POST"
											action="?/removeInvitee"
											use:enhance={confirmingRefresh(m.confirmDeleteInvitee(), true)}
										>
											<input type="hidden" name="inviteeId" value={inv.id} />
											<IconButton label={m.remove()} type="submit"><X size={16} /></IconButton>
										</form>
									{/if}
								</div>
							</div>
						{/if}
						{@render noteBody(inv)}
						<CopyLinkRow url={inv.url} {oncopied} class="mt-2.5" />
					</div>
				{/each}
			</div>

			{#if !closed}
				<AddParticipantForm action="?/addInvitee" enhance={refreshThen()} />
			{/if}
		{/if}
	</section>
{/key}
