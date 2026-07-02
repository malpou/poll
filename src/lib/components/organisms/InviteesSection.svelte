<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { enhance } from '$app/forms';
	import TextField from '$lib/components/atoms/TextField.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import IconButton from '$lib/components/atoms/IconButton.svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import CopyLinkRow from '$lib/components/molecules/CopyLinkRow.svelte';
	import AddParticipantForm from '$lib/components/molecules/AddParticipantForm.svelte';
	import { X, MessageSquare, Check } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import { refreshThen, confirmingRefresh } from '$lib/enhance';
	import type { InviteeView, Locale, PollMode } from '$lib/types';

	let {
		invitees,
		pollMode,
		closed,
		locale,
		oncopied
	}: {
		invitees: InviteeView[];
		pollMode: PollMode;
		closed: boolean;
		locale: Locale;
		oncopied: () => void;
	} = $props();

	// Invitee pill: partial gets its own copy; both incomplete states stay amber.
	const statusPill = (s: InviteeView['status']) =>
		s === 'complete'
			? { cls: 'bg-good-tint text-good', text: m.answered() }
			: {
					cls: 'bg-amber-tint text-amber',
					text: s === 'partial' ? m.partialAnswered() : m.pending()
				};

	// Expanded invitee notes.
	let expandedNotes = $state<Record<string, boolean>>({});
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
		<div class="mt-2.5 rounded-lg bg-card-alt px-3 py-2 text-[13px] leading-relaxed text-ink-muted">
			{inv.note}
		</div>
	{/if}
{/snippet}

{#key locale}
	<section>
		<SectionHeading text={m.participantsSection()} class="mb-3.5" />

		{#if pollMode === 'open'}
			<!-- Open mode: the shared link lives at the top. Here we just list the
			     respondents read-only (names come from submissions). -->
			{#if invitees.length > 0}
				<div class="flex flex-col gap-2.5">
					{#each invitees as inv, i (inv.id)}
						<div
							in:fly={{ y: 8, duration: 240, delay: i * 40, easing: cubicOut }}
							class="rounded-xl border border-border bg-card p-3"
						>
							<div class="flex items-center gap-2.5">
								<div class="flex-1 text-[15px] font-semibold text-ink">{inv.label}</div>
								{@render noteToggle(inv)}
							</div>
							{@render noteBody(inv)}
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-[13px] leading-relaxed text-ink-muted">{m.shareLinkHint()}</p>
			{/if}
		{:else}
			<div class="flex flex-col gap-2.5">
				{#each invitees as inv, i (inv.id)}
					<div
						in:fly={{ y: 8, duration: 240, delay: i * 40, easing: cubicOut }}
						class="rounded-xl border border-border bg-card p-3"
					>
						<div class="flex items-center gap-2.5">
							{#if closed}
								<div class="flex-1 text-[15px] font-semibold text-ink">{inv.label}</div>
							{:else}
								<form
									method="POST"
									action="?/renameInvitee"
									use:enhance={refreshThen()}
									class="flex flex-1 items-center gap-2.5"
								>
									<input type="hidden" name="inviteeId" value={inv.id} />
									<TextField name="label" value={inv.label} />
									<Button variant="ghost" type="submit" iconOnly label={m.save()}
										><Check size={16} /></Button
									>
								</form>
							{/if}
							<span
								class="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold {statusPill(
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
