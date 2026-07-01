<script lang="ts">
	import TextField from '$lib/components/atoms/TextField.svelte';
	import IconButton from '$lib/components/atoms/IconButton.svelte';
	import { X } from '@lucide/svelte';
	import type { DateOption } from '$lib/types';
	import { m } from '$lib/paraglide/messages';

	let {
		date = $bindable(),
		index,
		onremove
	}: {
		date: DateOption;
		index: number;
		onremove: () => void;
	} = $props();
</script>

<div class="rounded-xl border border-border bg-card p-3">
	<div class="flex items-center gap-2.5">
		<TextField type="date" name="dates.{index}.value" bind:value={date.value} />
		<IconButton label={m.remove()} onclick={onremove}><X size={16} /></IconButton>
	</div>
	<div class="mt-2.5 flex items-center gap-3.5">
		<div class="flex min-w-0 flex-1 items-center gap-2">
			<span class="shrink-0 text-xs font-semibold text-ink-muted">{m.from()}</span>
			<TextField type="time" compact name="dates.{index}.startTime" bind:value={date.startTime} />
		</div>
		<div class="flex min-w-0 flex-1 items-center gap-2">
			<span class="shrink-0 text-xs font-semibold text-ink-muted">{m.to()}</span>
			<TextField type="time" compact name="dates.{index}.endTime" bind:value={date.endTime} />
		</div>
	</div>
</div>
