<script lang="ts">
	import Callout from '$lib/components/molecules/Callout.svelte';
	import CopyLinkRow from '$lib/components/molecules/CopyLinkRow.svelte';
	import { Check, Send } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';

	// Fixed bottom bar of the response form: send CTA before submitting, saved
	// confirmation (+ personal edit link on open polls) after.
	let {
		submitted = $bindable(),
		allAnswered,
		editUrl,
		oncopied
	}: {
		submitted: boolean;
		allAnswered: boolean;
		editUrl: string | null;
		oncopied: () => void;
	} = $props();
</script>

<div
	class="fixed inset-x-0 bottom-0 z-80 flex justify-center border-t border-border bg-paper px-5 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3.5"
>
	<div class="w-full max-w-120">
		{#if submitted}
			<div class="flex flex-col gap-3">
				<div class="flex items-center gap-3">
					<div
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-good-tint text-good"
					>
						<Check size={18} />
					</div>
					<div class="flex min-w-0 flex-1 flex-col gap-0.5">
						<div class="text-body font-bold text-ink">{m.savedTitle()}</div>
						<div class="text-caption leading-snug text-ink-muted">{m.savedSub()}</div>
					</div>
					<button
						type="button"
						onclick={() => {
							submitted = false;
						}}
						class="shrink-0 cursor-pointer border-none bg-transparent p-2 text-caption font-semibold text-primary"
					>
						{m.editAnswer()}
					</button>
				</div>
				{#if editUrl}
					<Callout title={m.editLinkTitle()}>
						<p class="mt-1 text-caption leading-relaxed text-ink-muted">{m.editLinkHint()}</p>
						<CopyLinkRow url={editUrl} {oncopied} class="mt-2" />
					</Callout>
				{/if}
			</div>
		{:else}
			<div class="flex flex-col gap-1.5">
				{#if !allAnswered}
					<div class="text-center text-xs text-ink-muted">{m.chooseEach()}</div>
				{/if}
				<button
					type="submit"
					disabled={!allAnswered}
					class="flex h-13 w-full items-center justify-center gap-2 rounded-cta text-base font-bold transition-colors duration-150 {allAnswered
						? 'cursor-pointer bg-primary text-white'
						: 'cursor-default bg-border text-ink-muted'}"
				>
					<Send size={18} />
					{m.sendAnswer()}
				</button>
			</div>
		{/if}
	</div>
</div>
