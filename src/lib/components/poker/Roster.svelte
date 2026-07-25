<script lang="ts">
	import { scale } from 'svelte/transition';
	import Card from './Card.svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import { prefersReducedMotion } from '$lib/motion';
	import type { RosterSeat, RevealedVote } from '$lib/logic/poker-snapshot';
	import type { RoomPhase } from '$lib/types';
	import { m } from '$lib/paraglide/messages';

	let {
		roster,
		phase,
		revealed = null
	}: {
		roster: RosterSeat[];
		phase: RoomPhase;
		revealed?: RevealedVote[] | null;
	} = $props();

	const cardByPid = $derived(new Map((revealed ?? []).map((v) => [v.participantId, v.card])));
	// Only present seats are shown: a seat whose heartbeat has lapsed drops off
	// the roster (the "removed on leave" behavior, presence-windowed).
	const seats = $derived(roster.filter((s) => s.present));
	// Reveal flips all cards face-up together; reduced motion drops the transform.
	const flip = () => (prefersReducedMotion() ? { duration: 0 } : { start: 0.8, duration: 240 });
</script>

<section class="flex flex-col gap-3">
	<SectionHeading text={m.pokerRosterHeading()} />
	<ul class="flex flex-col gap-2">
		{#each seats as seat (seat.id)}
			<li
				class="flex items-center gap-2.5 rounded-control border-2 border-border bg-card-alt px-3 py-2"
			>
				<span class="h-2 w-2 shrink-0 rounded-full bg-good" aria-hidden="true"></span>
				<span class="min-w-0 flex-1 truncate text-body text-ink">{seat.name}</span>

				{#if seat.isController}
					<span
						class="rounded-full bg-ink px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-card"
						>{m.pokerControllerBadge()}</span
					>
				{/if}
				{#if seat.role === 'observer'}
					<span
						class="rounded-full border-2 border-border-strong px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-ink-muted"
						>{m.pokerObserverBadge()}</span
					>
				{/if}

				{#if seat.role === 'estimator'}
					{#if phase === 'revealed' && cardByPid.has(seat.id)}
						{#key cardByPid.get(seat.id)}
							<span in:scale={flip()}><Card card={cardByPid.get(seat.id)} size="sm" /></span>
						{/key}
					{:else if phase === 'voting'}
						{#if seat.hasVoted}
							<Card size="sm" faceDown />
							<span class="sr-only">{m.pokerVoted()}</span>
						{:else}
							<span class="text-caption text-ink-faint">{m.pokerThinking()}</span>
						{/if}
					{/if}
				{/if}
			</li>
		{/each}
	</ul>
</section>
