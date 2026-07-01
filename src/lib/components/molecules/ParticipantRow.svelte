<script lang="ts">
	import TextField from '$lib/components/atoms/TextField.svelte';
	import IconButton from '$lib/components/atoms/IconButton.svelte';
	import LinkChip from '$lib/components/atoms/LinkChip.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import type { Participant } from '$lib/types';
	import { da } from '$lib/da';
	import { helpers } from '$lib/data/shared';
	import { page } from '$app/state';

	let {
		participant = $bindable(),
		index,
		onremove,
		oncopy
	}: {
		participant: Participant;
		index: number;
		onremove: () => void;
		oncopy: (url: string) => void;
	} = $props();

	const url = $derived(helpers.inviteeUrl(page.url.origin, participant.token));
</script>

<div class="rounded-xl border border-border bg-card p-3">
	<div class="flex items-center gap-2.5">
		<TextField
			placeholder={da.name}
			name="participants.{index}.name"
			bind:value={participant.name}
		/>
		<input type="hidden" name="participants.{index}.token" value={participant.token} />
		<IconButton label={da.remove} onclick={onremove}>✕</IconButton>
	</div>
	<div class="mt-2.5 flex flex-wrap items-center gap-2.5">
		<LinkChip text={url.replace(/^https?:\/\//, '')} />
		<Button
			variant="ghost"
			onclick={() => {
				oncopy(url);
			}}>{da.copyLink}</Button
		>
	</div>
</div>
