<script lang="ts">
	import { enhance as applyEnhance } from '$app/forms';
	import TextField from '$lib/components/atoms/TextField.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import { Plus } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';

	// Same dual mode as AddDateForm: POST on /e, callback on / (nested <form>
	// inside the create form would be invalid HTML).
	let {
		action,
		enhance,
		onadd
	}: {
		action?: string;
		enhance?: Parameters<typeof applyEnhance>[1];
		onadd?: (name: string) => void;
	} = $props();

	let name = $state('');

	function add() {
		if (!name.trim()) return;
		onadd?.(name.trim());
		name = '';
	}
</script>

{#snippet card(post: boolean)}
	<div class="rounded-card border-2 border-dashed border-border-strong bg-card-alt p-3">
		<div class="flex items-center gap-2.5">
			{#if post}
				<TextField placeholder={m.name()} name="label" value="" />
			{:else}
				<TextField placeholder={m.name()} bind:value={name} />
			{/if}
			<Button
				variant="ghost"
				type={post ? 'submit' : 'button'}
				onclick={post ? undefined : add}
				disabled={!post && !name.trim()}><Plus size={14} />{m.addParticipant()}</Button
			>
		</div>
	</div>
{/snippet}

{#if action}
	<form method="POST" {action} use:applyEnhance={enhance} class="mt-2.5">
		{@render card(true)}
	</form>
{:else}
	<div class="mt-2.5">{@render card(false)}</div>
{/if}
