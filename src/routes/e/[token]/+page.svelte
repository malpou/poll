<script lang="ts">
	import DashboardPage from '$lib/components/templates/DashboardPage.svelte';
	import TextField from '$lib/components/atoms/TextField.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import { enhance } from '$app/forms';
	import { m } from '$lib/paraglide/messages';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head
	><title
		>{data.locked ? m.codePromptTitle() : data.invalid ? m.linkNotFound() : data.title} · {m.appName()}</title
	>
	<!-- Capability URLs: keep token pages out of search indexes (PROJECT.md). -->
	<meta name="robots" content="noindex" /></svelte:head
>

{#if data.locked}
	<!-- Admin-code gate (openspec/specs/admin-link-email): the poll has a code and
	     this browser doesn't hold it, so no organizer content is loaded. -->
	<main class="mx-auto max-w-100 px-4 py-16">
		<div class="paper-sheet">
			<h1 class="mb-2 text-title font-bold text-ink">{m.codePromptTitle()}</h1>
			<p class="mb-6 text-caption leading-relaxed text-ink-muted">{m.codePromptHint()}</p>
			<form method="POST" action="?/unlock" use:enhance class="flex flex-col gap-3.5">
				<TextField label={m.codePromptLabel()} name="code" autocomplete="off" />
				{#if form?.error}
					<div class="text-sm font-semibold text-bad">{form.error}</div>
				{/if}
				<Button variant="primary" type="submit">{m.codePromptSubmit()}</Button>
			</form>
		</div>
	</main>
{:else}
	<DashboardPage {data} />
{/if}
