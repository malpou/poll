<script lang="ts">
	import TextField from '$lib/components/atoms/TextField.svelte';
	import IconButton from '$lib/components/atoms/IconButton.svelte';
	import LinkChip from '$lib/components/atoms/LinkChip.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import { X, Copy } from '@lucide/svelte';
	import type { Participant } from '$lib/types';
	import { m } from '$lib/paraglide/messages';
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
			placeholder={m.name()}
			name="participants.{index}.name"
			bind:value={participant.name}
		/>
		<input type="hidden" name="participants.{index}.token" value={participant.token} />
		<IconButton label={m.remove()} onclick={onremove}><X size={16} /></IconButton>
	</div>
	<div class="mt-2.5 flex flex-wrap items-center gap-2.5">
		<LinkChip text={url.replace(/^https?:\/\//, '')} />
		<Button
			variant="ghost"
			iconOnly
			label={m.copyLink()}
			onclick={() => {
				oncopy(url);
			}}><Copy size={16} /></Button
		>
	</div>
</div>
