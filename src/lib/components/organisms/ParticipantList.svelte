<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import ParticipantRow from '$lib/components/molecules/ParticipantRow.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { Participant } from '$lib/types';

	let {
		participants = $bindable(),
		onadd,
		onremove,
		oncopy
	}: {
		participants: Participant[];
		onadd: () => void;
		onremove: (id: string) => void;
		oncopy: (url: string) => void;
	} = $props();
</script>

<div>
	<div class="mb-1 text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
		{m.participantsSection()}
	</div>
	<p class="mb-3.5 text-[13px] text-ink-muted">{m.participantsHint()}</p>
	<div class="flex flex-col gap-2.5">
		{#each participants as p, i (p.id)}
			<div in:fly={{ y: 8, duration: 240, delay: i * 40, easing: cubicOut }}>
				<ParticipantRow
					bind:participant={participants[i]}
					index={i}
					onremove={() => {
						onremove(p.id);
					}}
					{oncopy}
				/>
			</div>
		{/each}
	</div>
	<Button variant="dashed" onclick={onadd}>{m.addParticipant()}</Button>
</div>
