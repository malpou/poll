<script lang="ts">
	import { RoomClient } from '$lib/poker/client.svelte';
	import Deck from '$lib/components/poker/Deck.svelte';
	import Roster from '$lib/components/poker/Roster.svelte';
	import Signal from '$lib/components/poker/Signal.svelte';
	import Break from '$lib/components/poker/Break.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import TextField from '$lib/components/atoms/TextField.svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import NoticeBanner from '$lib/components/atoms/NoticeBanner.svelte';
	import CopyLinkRow from '$lib/components/molecules/CopyLinkRow.svelte';
	import { cardToText, estimateChoices } from '$lib/logic/poker';
	import { canReveal, pendingVoters } from '$lib/logic/poker-snapshot';
	import { m } from '$lib/paraglide/messages';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// The client owns the poll loop; recreated if the token ever changes (a fresh
	// navigation), torn down on unmount.
	let room = $state<RoomClient>();
	$effect(() => {
		const client = new RoomClient(data.token);
		client.start();
		room = client;
		return () => client.stop();
	});

	const snap = $derived(room?.snapshot ?? null);
	let nextTitle = $state('');
	let myName = $state('');

	function open() {
		if (nextTitle.trim()) {
			void room?.command('open', { title: nextTitle });
			nextTitle = '';
		}
	}
	function joinAsEstimator() {
		if (myName.trim()) void room?.command('join', { name: myName, role: 'estimator' });
	}
</script>

<svelte:head><title>{data.roomTitle}</title><meta name="robots" content="noindex" /></svelte:head>

<div
	data-accent={data.accent}
	data-testid="poker-console"
	class="mx-auto flex max-w-160 flex-col gap-6 px-4 pb-18 pt-7"
>
	<header class="flex flex-col gap-1">
		<div class="text-2xs font-bold uppercase tracking-widest text-ink-muted">
			{m.pokerAppName()} · {m.pokerControllerBadge()}
		</div>
		<h1 class="text-title font-bold text-ink"><span class="hl-swipe">{data.roomTitle}</span></h1>
	</header>

	<!-- Hidden once the room is closed: the link no longer lets anyone in, so
	     offering it to copy would only invite a dead hand-out. -->
	{#if snap?.status !== 'closed'}
		<section class="flex flex-col gap-2">
			<SectionHeading text={m.pokerJoinLinkLabel()} />
			<CopyLinkRow url={data.joinUrl} />
		</section>
	{/if}

	{#if snap}
		{#if snap.status === 'closed'}
			<NoticeBanner tone="ink" text={m.pokerClosedNotice()} />
		{:else}
			<Break
				calledBy={snap.breakCalledBy}
				oncall={() => room?.command('break', { on: true })}
				onend={() => room?.command('break', { on: false })}
			/>
			<!-- Phase-driven controls -->
			<section
				data-testid="poker-controls"
				class="flex flex-col gap-3 rounded-card border-2 border-border bg-card p-4"
			>
				<div
					class="text-2xs font-bold uppercase tracking-widest text-ink-muted"
					data-testid="poker-phase"
				>
					{snap.phase === 'voting'
						? m.pokerPhaseVoting()
						: snap.phase === 'revealed'
							? m.pokerPhaseRevealed()
							: m.pokerPhaseWaiting()}
				</div>

				{#if snap.phase === 'waiting'}
					<!-- A real <form> so Enter in the item field opens voting; item after
					     item is typed here all session, so the keyboard path matters. -->
					<form
						onsubmit={(e) => {
							e.preventDefault();
							open();
						}}
						class="flex flex-wrap items-end gap-2"
					>
						<TextField
							label={m.pokerNextItemLabel()}
							name="nextItem"
							bind:value={nextTitle}
							placeholder={m.pokerNextItemPlaceholder()}
						/>
						<div class="w-40 shrink-0">
							<Button type="submit">{m.pokerOpenVoting()}</Button>
						</div>
					</form>
				{:else if snap.activeRound}
					<div class="text-lead font-bold text-ink" data-testid="poker-active-item">
						{snap.activeRound.title}
					</div>

					{#if snap.phase === 'voting'}
						<!-- Locked until everyone present has voted, so a reveal can't cut
						     the round short; the caption names who is still out. -->
						{@const waiting = pendingVoters(snap.roster)}
						<Button
							type="button"
							disabled={!canReveal(snap.roster)}
							onclick={() => room?.command('reveal')}>{m.pokerReveal()}</Button
						>
						{#if waiting.length > 0}
							<p data-testid="poker-reveal-blocked" class="text-caption text-ink-muted">
								{m.pokerWaitingOn({ names: waiting.map((s) => s.name).join(', ') })}
							</p>
						{/if}
						<!-- Controller can estimate too. -->
						{#if snap.viewerSeated && snap.viewerRole === 'estimator'}
							<Deck selected={snap.myVote} onpick={(c) => room?.command('vote', { card: c })} />
						{:else}
							<form
								onsubmit={(e) => {
									e.preventDefault();
									joinAsEstimator();
								}}
								class="flex flex-wrap items-end gap-2"
							>
								<TextField
									label={m.pokerNameLabel()}
									name="ctrlName"
									bind:value={myName}
									placeholder={m.pokerNamePlaceholder()}
								/>
								<div class="w-44 shrink-0">
									<Button variant="ghost" type="submit">{m.pokerControllerEstimates()}</Button>
								</div>
							</form>
						{/if}
					{:else if snap.phase === 'revealed'}
						{#if snap.signal && snap.distribution}
							<Signal
								signal={snap.signal}
								distribution={snap.distribution}
								voters={snap.revealed ?? []}
							/>
						{/if}
						<SectionHeading text={m.pokerRecordEstimate()} />
						<!-- Only the numerals the room actually bracketed (lowest cast card
						     through highest), or split/skip. Suggestion pre-highlighted. -->
						{@const choices = estimateChoices((snap.revealed ?? []).map((v) => v.card))}
						<div class="flex flex-wrap gap-2" data-testid="poker-finalize">
							{#each choices as n (n)}
								<button
									type="button"
									onclick={() => room?.command('finalize', { estimate: cardToText(n) })}
									class="h-11 w-11 rounded-control border-2 font-bold transition hover:-translate-y-0.5
									{snap.signal?.suggestion === n
										? 'border-ink bg-hl-tint'
										: 'border-border-strong bg-card-alt'} text-ink">{n}</button
								>
							{/each}
							<Button
								variant="ghost"
								type="button"
								onclick={() => room?.command('finalize', { estimate: 'split' })}
								>{m.pokerSplit()}</Button
							>
							<Button
								variant="ghost"
								type="button"
								onclick={() => room?.command('finalize', { estimate: 'skip' })}
								>{m.pokerSkip()}</Button
							>
						</div>
						<Button variant="ghost" type="button" onclick={() => room?.command('revote')}
							>{m.pokerRevote()}</Button
						>
					{/if}
				{/if}
			</section>

			<Roster roster={snap.roster} phase={snap.phase} revealed={snap.revealed} />
		{/if}

		<!-- Results log -->
		<section class="flex flex-col gap-2" data-testid="poker-results">
			<SectionHeading text={m.pokerResultsHeading()} />
			{#if snap.results.length}
				<ul class="flex flex-col gap-1.5">
					{#each snap.results as r, i (i)}
						<li
							class="flex items-center gap-2 rounded-control border-2 border-border bg-card-alt px-3 py-2"
						>
							<span class="min-w-0 flex-1 truncate text-body text-ink">{r.title}</span>
							<span
								class="rounded-full bg-ink px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-card"
								>{r.estimate}</span
							>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-caption text-ink-faint">{m.pokerNoResults()}</p>
			{/if}
		</section>

		{#if snap.status !== 'closed'}
			<div class="w-44">
				<Button variant="ghost" type="button" onclick={() => room?.command('close')}
					>{m.pokerCloseRoom()}</Button
				>
			</div>
		{/if}
	{/if}
</div>
