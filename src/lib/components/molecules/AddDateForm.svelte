<script lang="ts">
	import { enhance as applyEnhance } from '$app/forms';
	import TextField from '$lib/components/atoms/TextField.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import { Plus } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';

	// The one way to add a date, on / and /e alike: dashed card, date + times,
	// "Add date". POST mode (action + enhance) submits to a form action; callback
	// mode (onadd) feeds local state on the create page, where a nested <form>
	// would be invalid HTML.
	let {
		action,
		enhance,
		onadd
	}: {
		action?: string;
		enhance?: Parameters<typeof applyEnhance>[1];
		onadd?: (d: { value: string; startTime: string; endTime: string }) => void;
	} = $props();

	let value = $state('');
	let startTime = $state('');
	let endTime = $state('');

	function add() {
		if (!value) return;
		onadd?.({ value, startTime, endTime });
		value = '';
		startTime = '';
		endTime = '';
	}
</script>

{#snippet card(post: boolean)}
	<div class="rounded-xl border border-dashed border-border bg-card p-3">
		<div class="flex items-center gap-2.5">
			{#if post}
				<!-- value="" makes the native picker start empty each render. -->
				<TextField type="date" name="value" value="" />
			{:else}
				<TextField type="date" bind:value />
			{/if}
			<Button
				variant="ghost"
				type={post ? 'submit' : 'button'}
				onclick={post ? undefined : add}
				disabled={!post && !value}><Plus size={14} />{m.addDate()}</Button
			>
		</div>
		<div class="mt-2.5 flex items-center gap-3.5">
			<div class="flex flex-1 items-center gap-2">
				<span class="shrink-0 text-xs font-semibold text-ink-muted">{m.from()}</span>
				{#if post}
					<TextField type="time" compact name="startTime" value="" />
				{:else}
					<TextField type="time" compact bind:value={startTime} />
				{/if}
			</div>
			<div class="flex flex-1 items-center gap-2">
				<span class="shrink-0 text-xs font-semibold text-ink-muted">{m.to()}</span>
				{#if post}
					<TextField type="time" compact name="endTime" value="" />
				{:else}
					<TextField type="time" compact bind:value={endTime} />
				{/if}
			</div>
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
