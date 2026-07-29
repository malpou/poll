<script lang="ts">
	import Card from '$lib/components/poker/Card.svelte';
	import Signal from '$lib/components/poker/Signal.svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import { agreementSignal, voteDistribution, type Card as TCard } from '$lib/logic/poker';
	import { m } from '$lib/paraglide/messages';
	import { createUrl } from '$lib/logic/site-urls';
	import { ArrowRight } from '@lucide/svelte';
	import type { Accent, Locale } from '$lib/types';

	// Planning poker's landing section. A sibling tool, not a sixth poll type -
	// but it wears the page's highlighter like everything else, because a room
	// takes an organizer-picked accent exactly as a poll does. The separation is
	// carried by position and the badge, not by a different colour.
	let { locale, accent }: { locale: Locale; accent: Accent } = $props();

	// A one-tap toy of the capability's signature interaction: four seats sit
	// face-down, one tap turns them all over together and the agreement read-out
	// appears. Not a simulated round - no joining, no naming, no live client.
	// Nothing is persisted; a reload is back to face-down.
	const SEATS: { name: string; card: TCard }[] = [
		{ name: 'Ada', card: 5 },
		{ name: 'Bo', card: 5 },
		{ name: 'Kim', card: 8 },
		{ name: 'Ida', card: 5 }
	];
	const CARDS = SEATS.map((s) => s.card);

	let revealed = $state(false);
	const signal = $derived(revealed ? agreementSignal(CARDS) : null);
	const distribution = $derived(revealed ? voteDistribution(CARDS) : null);
</script>

<section data-testid="landing-poker" class="flex flex-col gap-4">
	<div>
		<!-- The badge is why this sits above the examples: nobody arrives looking
		     for planning poker, so the section has to announce itself. Reuses the
		     solid-ink pill from the roster's controller badge. -->
		<div class="flex items-center gap-2.5">
			<span
				class="rounded-full bg-ink px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-card"
				>{m.landingPokerBadge()}</span
			>
			<SectionHeading text={m.landingPokerTitle()} />
		</div>
		<p class="mt-2 max-w-prose text-body leading-relaxed text-ink-soft">
			{m.landingPokerIntro()}
		</p>
	</div>

	<div class="flex flex-col gap-3 rounded-card border-2 border-border bg-card p-4">
		<div class="text-2xs font-bold uppercase tracking-widest text-ink-muted">
			{m.landingPokerExampleLabel()}
		</div>

		<div class="flex flex-wrap gap-3">
			{#each SEATS as seat (seat.name)}
				<div class="flex flex-col items-center gap-1.5">
					<Card card={seat.card} faceDown={!revealed} />
					<span class="text-2xs font-bold text-ink-muted">{seat.name}</span>
				</div>
			{/each}
		</div>

		{#if signal && distribution}
			<Signal {signal} {distribution} voters={SEATS} />
		{:else}
			<button
				type="button"
				onclick={() => (revealed = true)}
				class="h-11 cursor-pointer rounded-cta border-2 border-ink bg-transparent px-4 text-caption font-bold text-ink transition duration-150 hover:bg-ink hover:text-card"
			>
				{m.landingPokerReveal()}
			</button>
		{/if}
	</div>

	<!-- Crawlable; carries the page's language and highlighter, so a Danish
	     visitor who picked pink lands on the Danish create page, on pink, with
	     the room branch already chosen. -->
	<a
		href={createUrl(locale, accent, 'poker')}
		class="inline-flex h-13 w-full cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-cta bg-ink px-6 text-body font-bold tracking-wider text-card transition duration-150 hover:-translate-y-0.5 hover:bg-primary-hover"
	>
		{m.pokerCreateTitle()}
		<ArrowRight size={17} aria-hidden="true" />
	</a>
</section>
