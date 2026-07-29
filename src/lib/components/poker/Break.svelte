<script lang="ts">
	import { Coffee } from '@lucide/svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import { m } from '$lib/paraglide/messages';

	// A coffee break is a human signal, available in every phase and to everyone
	// in the room - the ☕ card only reaches the table during a voting round.
	// Advisory: it holds nothing up, it just says out loud that the room stopped.
	let {
		calledBy,
		oncall,
		onend
	}: {
		// null = no break; '' = called by someone without a seat.
		calledBy: string | null;
		oncall: () => void;
		onend: () => void;
	} = $props();
</script>

{#if calledBy === null}
	<div class="w-fit">
		<Button variant="ghost" onclick={oncall}>
			<Coffee size={14} aria-hidden="true" />
			{m.pokerCallBreak()}
		</Button>
	</div>
{:else}
	<div
		data-testid="poker-break"
		class="flex items-center gap-2.5 rounded-card border-2 border-border bg-hl-tint px-4 py-3 text-sm font-semibold text-ink"
	>
		<Coffee size={17} aria-hidden="true" />
		<span class="min-w-0 flex-1"
			>{calledBy ? m.pokerBreakCalledBy({ name: calledBy }) : m.pokerBreakCalledAnon()}</span
		>
		<Button variant="ghost" onclick={onend}>{m.pokerEndBreak()}</Button>
	</div>
{/if}
