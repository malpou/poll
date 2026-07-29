<script lang="ts">
	import { RoomClient } from '$lib/poker/client.svelte';
	import Deck from '$lib/components/poker/Deck.svelte';
	import Roster from '$lib/components/poker/Roster.svelte';
	import Signal from '$lib/components/poker/Signal.svelte';
	import Break from '$lib/components/poker/Break.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import TextField from '$lib/components/atoms/TextField.svelte';
	import NoticeBanner from '$lib/components/atoms/NoticeBanner.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let room = $state<RoomClient>();
	$effect(() => {
		const client = new RoomClient(data.token);
		client.start();
		room = client;
		return () => client.stop();
	});

	const snap = $derived(room?.snapshot ?? null);
	let name = $state('');
	let asObserver = $state(false);

	function join() {
		if (name.trim())
			void room?.command('join', { name, role: asObserver ? 'observer' : 'estimator' });
	}
</script>

<svelte:head><title>{data.roomTitle}</title><meta name="robots" content="noindex" /></svelte:head>

<div
	data-accent={data.accent}
	data-testid="poker-room"
	class="mx-auto flex max-w-120 flex-col gap-6 px-4 pb-18 pt-7"
>
	<header class="flex flex-col gap-1">
		<div class="text-2xs font-bold uppercase tracking-widest text-ink-muted">
			{m.pokerAppName()}
		</div>
		<h1 class="text-title font-bold text-ink"><span class="hl-swipe">{data.roomTitle}</span></h1>
	</header>

	{#if snap}
		{#if snap.status === 'closed'}
			<NoticeBanner tone="ink" text={m.pokerClosedNotice()} />
		{:else if !snap.viewerSeated}
			<!-- Name yourself to take a seat. A real <form> so Enter in the name
			     field joins, without a keydown handler; nothing is posted. -->
			<form
				onsubmit={(e) => {
					e.preventDefault();
					join();
				}}
				class="flex flex-col gap-3 rounded-card border-2 border-border bg-card p-4"
			>
				<TextField
					label={m.pokerNameLabel()}
					name="name"
					bind:value={name}
					placeholder={m.pokerNamePlaceholder()}
				/>
				<label class="flex items-center gap-2 text-caption text-ink-soft">
					<input type="checkbox" bind:checked={asObserver} class="h-4 w-4 accent-ink" />
					{m.pokerJoinAsObserver()}
				</label>
				<Button type="submit">{m.pokerJoinButton()}</Button>
			</form>
		{:else}
			<!-- Seated: the live view. Anyone here can stop the room for coffee. -->
			<Break
				calledBy={snap.breakCalledBy}
				oncall={() => room?.command('break', { on: true })}
				onend={() => room?.command('break', { on: false })}
			/>
			<section
				data-testid="poker-stage"
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
					<p class="text-caption text-ink-muted">{m.pokerWaitingForController()}</p>
				{:else if snap.activeRound}
					<div class="text-lead font-bold text-ink" data-testid="poker-active-item">
						{snap.activeRound.title}
					</div>

					{#if snap.viewerRole === 'observer'}
						<NoticeBanner tone="ink" text={m.pokerObservingNotice()} />
						{#if snap.phase === 'revealed' && snap.signal && snap.distribution}
							<Signal
								signal={snap.signal}
								distribution={snap.distribution}
								voters={snap.revealed ?? []}
							/>
						{/if}
					{:else if snap.phase === 'voting'}
						<div class="text-2xs font-bold uppercase tracking-widest text-ink-muted">
							{m.pokerPickACard()}
						</div>
						<Deck selected={snap.myVote} onpick={(c) => room?.command('vote', { card: c })} />
						<p class="text-caption text-ink-faint">{m.pokerHiddenNotice()}</p>
					{:else if snap.phase === 'revealed'}
						{#if snap.signal && snap.distribution}
							<Signal
								signal={snap.signal}
								distribution={snap.distribution}
								voters={snap.revealed ?? []}
							/>
						{/if}
					{/if}
				{/if}
			</section>

			<Roster roster={snap.roster} phase={snap.phase} revealed={snap.revealed} />
		{/if}
	{/if}
</div>
