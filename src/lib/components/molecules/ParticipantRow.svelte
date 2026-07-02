<script lang="ts">
	import TextField from '$lib/components/atoms/TextField.svelte';
	import IconButton from '$lib/components/atoms/IconButton.svelte';
	import CopyLinkRow from '$lib/components/molecules/CopyLinkRow.svelte';
	import { X } from '@lucide/svelte';
	import type { Participant } from '$lib/types';
	import { m } from '$lib/paraglide/messages';
	import { helpers } from '$lib/data/shared';
	import { page } from '$app/state';

	let {
		participant = $bindable(),
		index,
		onremove,
		oncopied
	}: {
		participant: Participant;
		index: number;
		onremove: () => void;
		oncopied: () => void;
	} = $props();

	const url = $derived(helpers.inviteeUrl(page.url.origin, participant.token));
</script>

<div class="rounded-card border-2 border-border bg-card-alt p-3">
	<div class="flex items-center gap-2.5">
		<TextField
			placeholder={m.name()}
			name="participants.{index}.name"
			bind:value={participant.name}
		/>
		<input type="hidden" name="participants.{index}.token" value={participant.token} />
		<IconButton label={m.remove()} onclick={onremove}><X size={16} /></IconButton>
	</div>
	<CopyLinkRow {url} {oncopied} class="mt-2.5" />
</div>
