<script lang="ts">
	import { CircleQuestionMark, Infinity as InfinityIcon, Coffee } from '@lucide/svelte';
	import { isSpecialCard, type Card } from '$lib/logic/poker';
	import { m } from '$lib/paraglide/messages';

	let {
		card = null,
		size = 'md',
		selected = false,
		faceDown = false
	}: {
		// null renders a blank back (used for a face-down "voted" marker).
		card?: Card | null;
		size?: 'sm' | 'md';
		selected?: boolean;
		faceDown?: boolean;
	} = $props();

	const dims = $derived(size === 'sm' ? 'h-12 w-9 text-body' : 'h-19 w-14 text-lead');
	const icon = $derived(size === 'sm' ? 15 : 20);

	// Aria/label for the special cards; numerals speak for themselves.
	function aria(c: Card): string {
		if (c === '?') return m.pokerCardQuestion();
		if (c === 'infinity') return m.pokerCardInfinity();
		if (c === 'coffee') return m.pokerCardCoffee();
		return String(c);
	}
</script>

<span
	class="flex shrink-0 items-center justify-center rounded-control border-2 font-bold transition
	{dims}
	{selected ? 'border-ink bg-hl-tint text-ink' : 'border-border-strong bg-card-alt text-ink'}"
	aria-label={faceDown || card === null ? undefined : aria(card)}
>
	{#if faceDown || card === null}
		<!-- Card back: a face-down vote, value withheld. -->
		<span class="text-ink-faint" aria-hidden="true">•</span>
	{:else if isSpecialCard(card)}
		{#if card === '?'}<CircleQuestionMark size={icon} />
		{:else if card === 'infinity'}<InfinityIcon size={icon} />
		{:else}<Coffee size={icon} />{/if}
	{:else}
		{card}
	{/if}
</span>
