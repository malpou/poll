<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { enhance } from '$app/forms';
	import TextField from '$lib/components/atoms/TextField.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import IconButton from '$lib/components/atoms/IconButton.svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import AddDateForm from '$lib/components/molecules/AddDateForm.svelte';
	import { X, ArrowUpNarrowWide, ChevronUp, ChevronDown, Pencil, Check } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import { refreshThen, confirmingRefresh } from '$lib/forms/enhance';
	import type { Locale, OptionView } from '$lib/types';

	let {
		options,
		closed,
		locale
	}: {
		options: OptionView[];
		closed: boolean;
		locale: Locale;
	} = $props();

	// Which option is in inline-edit mode (id) - null when none.
	let editing = $state<string | null>(null);
	const closeEdit = refreshThen(() => (editing = null));
</script>

{#key locale}
	<section class="mb-10">
		<div class="mb-3.5 flex items-center justify-between gap-2.5">
			<SectionHeading text={m.datesSection()} />
			{#if !closed && options.length > 1}
				<form method="POST" action="?/sortOptions" use:enhance={refreshThen()}>
					<Button variant="ghost" type="submit"
						><ArrowUpNarrowWide size={14} />{m.sortByDate()}</Button
					>
				</form>
			{/if}
		</div>
		<div class="flex flex-col gap-2.5">
			{#each options as opt, i (opt.id)}
				<div
					in:fly={{ y: 8, duration: 240, delay: i * 40, easing: cubicOut }}
					class="rounded-xl border border-border bg-card p-3"
				>
					{#if editing === opt.id}
						<form
							method="POST"
							action="?/editOption"
							use:enhance={closeEdit}
							class="flex flex-col gap-2.5"
						>
							<input type="hidden" name="optionId" value={opt.id} />
							<div class="flex items-center gap-2.5">
								<TextField type="date" name="value" value={opt.value} />
								<Button variant="ghost" type="submit" iconOnly label={m.save()}
									><Check size={16} /></Button
								>
								<IconButton
									label={m.cancel()}
									onclick={() => {
										editing = null;
									}}><X size={16} /></IconButton
								>
							</div>
							<div class="flex items-center gap-3.5">
								<div class="flex flex-1 items-center gap-2">
									<span class="shrink-0 text-xs font-semibold text-ink-muted">{m.from()}</span>
									<TextField type="time" compact name="startTime" value={opt.startTime} />
								</div>
								<div class="flex flex-1 items-center gap-2">
									<span class="shrink-0 text-xs font-semibold text-ink-muted">{m.to()}</span>
									<TextField type="time" compact name="endTime" value={opt.endTime} />
								</div>
							</div>
						</form>
					{:else}
						<div class="flex items-center justify-between gap-2.5">
							<div class="min-w-0">
								<div class="text-body font-semibold text-ink">
									{opt.weekday}
									{opt.dateLabel}
								</div>
								{#if opt.timeRange}
									<div class="text-caption text-ink-muted">{opt.timeRange}</div>
								{/if}
							</div>
							{#if !closed}
								<div class="flex shrink-0 items-center gap-2">
									{#if options.length > 1}
										{#each [{ dir: 'up', Icon: ChevronUp, label: m.moveUp(), off: i === 0 }, { dir: 'down', Icon: ChevronDown, label: m.moveDown(), off: i === options.length - 1 }] as mv (mv.dir)}
											<form method="POST" action="?/moveOption" use:enhance={refreshThen()}>
												<input type="hidden" name="optionId" value={opt.id} />
												<input type="hidden" name="direction" value={mv.dir} />
												<Button
													variant="ghost"
													iconOnly
													type="submit"
													label={mv.label}
													disabled={mv.off}><mv.Icon size={16} /></Button
												>
											</form>
										{/each}
									{/if}
									<Button
										variant="ghost"
										iconOnly
										label={m.edit()}
										onclick={() => {
											editing = opt.id;
										}}><Pencil size={16} /></Button
									>
									<form
										method="POST"
										action="?/removeOption"
										use:enhance={confirmingRefresh(m.confirmDeleteOption(), opt.hasResponses)}
									>
										<input type="hidden" name="optionId" value={opt.id} />
										<IconButton label={m.remove()} type="submit"><X size={16} /></IconButton>
									</form>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		{#if !closed}
			<AddDateForm action="?/addOption" enhance={refreshThen()} />
		{/if}
	</section>
{/key}
