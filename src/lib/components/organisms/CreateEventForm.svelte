<script lang="ts">
	import TextField from '$lib/components/atoms/TextField.svelte';
	import TextArea from '$lib/components/atoms/TextArea.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import DateList from '$lib/components/organisms/DateList.svelte';
	import ParticipantList from '$lib/components/organisms/ParticipantList.svelte';
	import Toast from '$lib/components/feedback/Toast.svelte';
	import { da } from '$lib/da';
	import { helpers } from '$lib/data/shared';
	import { mockProvider } from '$lib/data/mock';
	import type { DateOption, Participant } from '$lib/types';

	const seed = helpers.seedEvent();

	let title = $state(seed.title);
	let description = $state(seed.description);
	let dates = $state<DateOption[]>([
		{ id: 'seed-d1', value: '2026-09-12', startTime: '10:00', endTime: '11:00' },
		{ id: 'seed-d2', value: '2026-09-20', startTime: '11:00', endTime: '12:00' }
	]);
	let participants = $state<Participant[]>([
		{ ...helpers.blankParticipant(), name: 'Anna' },
		{ ...helpers.blankParticipant(), name: 'Morten' }
	]);

	let created = $state(false);
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
		navigator.clipboard?.writeText(url).catch(() => {});
		clearTimeout(toastTimer);
		toastOpen = true;
		toastTimer = setTimeout(() => (toastOpen = false), 3000);
	}

	async function create() {
		await mockProvider.createEvent($state.snapshot({ title, description, dates, participants }));
		created = true;
	}
</script>

<div class="mx-auto max-w-[640px] px-6 pb-24 pt-10">
	<h1 class="mb-8 text-[28px] font-extrabold tracking-[-0.02em] text-ink">
		{da.createTitle}
	</h1>

	<div class="mb-6">
		<TextField label={da.fieldTitle} bind:value={title} />
	</div>

	<div class="mb-10">
		<TextArea label={da.fieldDescription} bind:value={description} />
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
		<Button variant="primary" onclick={create}>{da.create}</Button>
		{#if created}
			<div class="flex items-center gap-2 text-sm font-semibold text-good">
				<span
					class="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-good-tint text-[13px] text-good"
				>
					✓
				</span>
				{da.created}
			</div>
		{/if}
	</div>
</div>

<Toast open={toastOpen} text={da.linkCopied} />
