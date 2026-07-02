<script lang="ts">
	import Callout from '$lib/components/molecules/Callout.svelte';
	import CopyLinkRow from '$lib/components/molecules/CopyLinkRow.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import { ArrowRight, Check, Pencil } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import type { PollType } from '$lib/types';

	// Bottom of the response form, inline on the sheet: send CTA before
	// submitting, the answered notice card (+ personal edit link on open polls)
	// after.
	let {
		submitted = $bindable(),
		allAnswered,
		editUrl,
		oncopied,
		pollType = 'dates'
	}: {
		submitted: boolean;
		allAnswered: boolean;
		editUrl: string | null;
		oncopied: () => void;
		pollType?: PollType;
	} = $props();
</script>

<div class="mt-8">
	{#if submitted}
		<div class="flex flex-col gap-3.5">
			<!-- Answered notice: ink border on a highlighter-tinted card. -->
			<div class="rounded-card border-2 border-ink bg-hl-tint p-4.5">
				<p class="mb-1.5 flex items-center gap-2 text-body font-bold text-ink">
					<Check size={16} class="shrink-0" aria-hidden="true" />
					{m.savedTitle()}
				</p>
				<p class="mb-3.5 text-caption leading-relaxed text-ink-soft">{m.savedSub()}</p>
				<Button
					variant="ghost"
					onclick={() => {
						submitted = false;
					}}
				>
					<Pencil size={13} />{m.editAnswer()}
				</Button>
			</div>
			{#if editUrl}
				<Callout title={m.editLinkTitle()}>
					<p class="mt-1 text-caption leading-relaxed text-ink-muted">{m.editLinkHint()}</p>
					<CopyLinkRow url={editUrl} {oncopied} class="mt-2" />
				</Callout>
			{/if}
		</div>
	{:else}
		<div class="flex flex-col gap-2.5">
			{#if !allAnswered}
				<div class="text-center text-caption text-ink-muted">
					{pollType === 'question'
						? m.chooseEachQuestion()
						: pollType === 'rsvp'
							? m.chooseEachRsvp()
							: m.chooseEach()}
				</div>
			{/if}
			<button
				type="submit"
				disabled={!allAnswered}
				class="flex h-13 w-full items-center justify-center gap-2 rounded-cta text-base font-bold tracking-wider transition duration-150 {allAnswered
					? 'cursor-pointer bg-ink text-card hover:-translate-y-0.5'
					: 'cursor-not-allowed bg-wash text-ink-muted'}"
			>
				{m.sendAnswer()}
				<ArrowRight size={17} />
			</button>
		</div>
	{/if}
</div>
