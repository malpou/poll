<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import TextField from '$lib/components/atoms/TextField.svelte';
	import { ArrowRight } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head
	><title>{m.pokerCreateTitle()}</title><meta name="robots" content="noindex" /></svelte:head
>

<div data-accent="blue" class="mx-auto max-w-100 px-4 py-16">
	<main class="paper-sheet">
		<h1 class="mb-2 text-title font-bold text-ink">
			<span class="hl-swipe">{m.pokerCreateTitle()}</span>
		</h1>
		<p class="mb-6 text-caption leading-relaxed text-ink-muted">{m.pokerCreateLead()}</p>
		<form method="POST" action="?/create" use:enhance class="flex flex-col gap-4">
			<TextField
				label={m.pokerRoomNameLabel()}
				name="title"
				value={form?.title ?? ''}
				placeholder={m.pokerRoomNamePlaceholder()}
			/>
			{#if form?.error}
				<div class="text-sm font-semibold text-bad">{form.error}</div>
			{/if}
			<Button type="submit">
				{m.pokerCreateButton()}
				<ArrowRight size={17} />
			</Button>
		</form>
	</main>
</div>
