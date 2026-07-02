<script lang="ts">
	import { fly } from 'svelte/transition';
	import { flyIn } from '$lib/motion';
	import TextField from '$lib/components/atoms/TextField.svelte';
	import IconButton from '$lib/components/atoms/IconButton.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import { Plus, X } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import { newToken } from '$lib/data/shared';

	// Create-page editor for a question poll's text options. Same fill-then-add
	// list as participants; rows post indexed `options.{i}.text` fields.
	let { options = $bindable() }: { options: { id: string; text: string }[] } = $props();

	let draft = $state('');
	function add() {
		if (!draft.trim()) return;
		options.push({ id: newToken(), text: draft.trim() });
		draft = '';
	}
</script>

<div class="flex flex-col gap-2.5">
	{#each options as o, i (o.id)}
		<div in:fly={flyIn(i)} class="rounded-card border-2 border-border bg-card-alt p-3">
			<div class="flex items-center gap-2.5">
				<TextField
					placeholder={m.optionPlaceholder()}
					name="options.{i}.text"
					bind:value={options[i].text}
				/>
				<IconButton
					label={m.remove()}
					onclick={() => (options = options.filter((x) => x.id !== o.id))}
					><X size={16} /></IconButton
				>
			</div>
		</div>
	{/each}
</div>
<div class="mt-2.5 rounded-card border-2 border-dashed border-border-strong bg-card-alt p-3">
	<div class="flex items-center gap-2.5">
		<TextField placeholder={m.optionPlaceholder()} bind:value={draft} />
		<Button variant="ghost" type="button" onclick={add} disabled={!draft.trim()}
			><Plus size={14} />{m.addOption()}</Button
		>
	</div>
</div>
