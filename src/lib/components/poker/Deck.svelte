<script lang="ts">
	import Card from './Card.svelte';
	import { DECK, cardToText, type Card as TCard } from '$lib/logic/poker';

	let {
		selected = null,
		disabled = false,
		onpick
	}: {
		selected?: TCard | null;
		disabled?: boolean;
		onpick: (cardText: string) => void;
	} = $props();
</script>

<div class="flex flex-wrap gap-2">
	{#each DECK as card (cardToText(card))}
		<button
			type="button"
			{disabled}
			onclick={() => onpick(cardToText(card))}
			class="rounded-control transition hover:-translate-y-1 disabled:pointer-events-none disabled:opacity-50
			{selected === card ? '-translate-y-1' : ''}"
		>
			<Card {card} selected={selected === card} />
		</button>
	{/each}
</div>
