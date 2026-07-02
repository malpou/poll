<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import ParticipantRow from '$lib/components/molecules/ParticipantRow.svelte';
	import AddParticipantForm from '$lib/components/molecules/AddParticipantForm.svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { Participant } from '$lib/types';

	let {
		participants = $bindable(),
		onadd,
		onremove,
		oncopied
	}: {
		participants: Participant[];
		onadd: (name: string) => void;
		onremove: (id: string) => void;
		oncopied: () => void;
	} = $props();
</script>

<div>
	<SectionHeading text={m.participantsSection()} class="mb-1" />
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
					{oncopied}
				/>
			</div>
		{/each}
	</div>
	<AddParticipantForm {onadd} />
</div>
