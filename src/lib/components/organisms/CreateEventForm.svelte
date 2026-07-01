<script lang="ts">
	import TextField from '$lib/components/atoms/TextField.svelte';
	import TextArea from '$lib/components/atoms/TextArea.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import DateList from '$lib/components/organisms/DateList.svelte';
	import ParticipantList from '$lib/components/organisms/ParticipantList.svelte';
	import Toast from '$lib/components/feedback/Toast.svelte';
	import { enhance } from '$app/forms';
	import { da } from '$lib/da';
	import { helpers } from '$lib/data/shared';
	import type { DateOption, Participant } from '$lib/types';

	// The create action's fail() payload; null on first render / success.
	let { form }: { form: { error?: string } | null } = $props();

	// Start empty — one blank row each so the form is usable without seed data.
	let title = $state('');
	let description = $state('');
	let dates = $state<DateOption[]>([helpers.blankDate()]);
	let participants = $state<Participant[]>([helpers.blankParticipant()]);

	let toastOpen = $state(false);
	let toastTimer: ReturnType<typeof setTimeout> | undefined;

	function addDate() {
		dates.push(helpers.blankDate());
	}
	function removeDate(id: string) {
		dates = dates.filter((d) => d.id !== id);
	}
	function addParticipant() {
		participants.push(helpers.blankParticipant());
	}
	function removeParticipant(id: string) {
		participants = participants.filter((p) => p.id !== id);
	}

	function copy(url: string) {
		void navigator.clipboard.writeText(url).catch(() => undefined);
		clearTimeout(toastTimer);
		toastOpen = true;
		toastTimer = setTimeout(() => (toastOpen = false), 3000);
	}
</script>

<form method="POST" action="?/create" use:enhance class="mx-auto max-w-[640px] px-6 pb-24 pt-10">
	<h1 class="mb-3 text-[28px] font-extrabold tracking-[-0.02em] text-ink">
		{da.createTitle}
	</h1>
	<p class="mb-8 max-w-[52ch] text-[15px] leading-relaxed text-ink-muted">
		{da.createIntro}
	</p>

	<div class="mb-6">
		<TextField label={da.fieldTitle} name="title" bind:value={title} />
	</div>

	<div class="mb-10">
		<TextArea label={da.fieldDescription} name="description" bind:value={description} />
	</div>

	<div class="mb-10">
		<DateList bind:dates onadd={addDate} onremove={removeDate} />
	</div>

	<div class="mb-9">
		<ParticipantList
			bind:participants
			onadd={addParticipant}
			onremove={removeParticipant}
			oncopy={copy}
		/>
	</div>

	<div class="mt-2 flex items-center gap-3.5">
		<Button variant="primary" type="submit">{da.create}</Button>
		{#if form?.error}
			<div class="text-sm font-semibold text-bad">{form.error}</div>
		{/if}
	</div>
</form>

<Toast open={toastOpen} text={da.linkCopied} />
