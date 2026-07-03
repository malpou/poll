<script lang="ts">
	import { fly } from 'svelte/transition';
	import { flyIn, swapIn } from '$lib/motion';
	import { enhance } from '$app/forms';
	import TextField from '$lib/components/atoms/TextField.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import IconButton from '$lib/components/atoms/IconButton.svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import CalendarDatePicker from '$lib/components/molecules/CalendarDatePicker.svelte';
	import { X, ArrowUpNarrowWide, ChevronUp, ChevronDown, Pencil, Save, Plus } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import { refreshThen, confirmingRefresh } from '$lib/forms/enhance';
	import type { DateOption, Locale, OptionView, PollType } from '$lib/types';

	let {
		options,
		closed,
		locale,
		pollType = 'dates'
	}: {
		options: OptionView[];
		closed: boolean;
		locale: Locale;
		pollType?: PollType;
	} = $props();

	const question = $derived(pollType === 'question');
	// An RSVP keeps exactly one date: editable while open, never added to,
	// removed, or reordered (openspec/specs/rsvp-poll).
	const rsvp = $derived(pollType === 'rsvp');

	// Which option is in inline-edit mode (id) - null when none.
	let editing = $state<string | null>(null);
	const closeEdit = refreshThen(() => (editing = null));

	// Days + slots picked in the add-dates calendar, cleared on a successful add.
	let adding = $state<DateOption[]>([]);
	// Question polls add one text option at a time instead.
	let addingText = $state('');
</script>

{#key locale}
	<section class="mb-10" in:fly={swapIn({ y: 0 })}>
		<div class="mb-3.5 flex items-center justify-between gap-2.5">
			<SectionHeading
				text={question ? m.optionsSection() : rsvp ? m.dateSectionRsvp() : m.datesSection()}
			/>
			{#if !closed && !question && options.length > 1}
				<form method="POST" action="?/sortOptions" use:enhance={refreshThen()}>
					<Button variant="ghost" type="submit"
						><ArrowUpNarrowWide size={14} />{m.sortByDate()}</Button
					>
				</form>
			{/if}
		</div>
		<div class="flex flex-col gap-2.5">
			{#each options as opt, i (opt.id)}
				<div in:fly={flyIn(i)} class="rounded-card border-2 border-border bg-card-alt p-3">
					{#if editing === opt.id}
						<form
							method="POST"
							action="?/editOption"
							use:enhance={closeEdit}
							class="flex flex-col gap-2.5"
						>
							<input type="hidden" name="optionId" value={opt.id} />
							<div class="flex items-center gap-2.5">
								{#if question}
									<TextField name="label" value={opt.label} />
								{:else}
									<TextField type="date" name="value" value={opt.value} />
								{/if}
								<Button variant="ghost" type="submit" iconOnly label={m.save()}
									><Save size={16} /></Button
								>
								<IconButton
									label={m.cancel()}
									onclick={() => {
										editing = null;
									}}><X size={16} /></IconButton
								>
							</div>
							{#if !question}
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
							{/if}
						</form>
					{:else}
						<!-- The date keeps a readable column; when the buttons don't fit
						     beside it they wrap onto their own right-aligned row instead
						     of squeezing the text. -->
						<div class="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
							<div class="min-w-0 flex-1 basis-52 text-body text-ink">
								{#if opt.label}
									<span class="font-bold">{opt.label}</span>
								{:else}
									<span class="font-bold capitalize">{opt.weekday}</span>
									<span class="text-ink-soft">{opt.dateLabel}</span>
									{#if opt.timeRange}
										<span class="text-caption text-ink-muted">· {opt.timeRange}</span>
									{/if}
								{/if}
							</div>
							{#if !closed}
								<div class="ml-auto flex shrink-0 items-center gap-2">
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
									{#if !rsvp}
										<form
											method="POST"
											action="?/removeOption"
											use:enhance={confirmingRefresh(
												question ? m.confirmDeleteOptionQuestion() : m.confirmDeleteOption(),
												opt.hasResponses
											)}
										>
											<input type="hidden" name="optionId" value={opt.id} />
											<IconButton label={m.remove()} type="submit"><X size={16} /></IconButton>
										</form>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		{#if !closed && !rsvp}
			{#if question}
				<form
					method="POST"
					action="?/addOption"
					use:enhance={refreshThen(() => (addingText = ''))}
					class="mt-2.5 rounded-card border-2 border-dashed border-border-strong bg-card-alt p-3"
				>
					<div class="flex items-center gap-2.5">
						<TextField placeholder={m.optionPlaceholder()} name="label" bind:value={addingText} />
						<Button variant="ghost" type="submit" disabled={!addingText.trim()}>
							<Plus size={14} />{m.addOption()}
						</Button>
					</div>
				</form>
			{:else}
				<form
					method="POST"
					action="?/addOption"
					use:enhance={refreshThen(() => (adding = []))}
					class="mt-2.5 flex flex-col gap-2.5"
				>
					<CalendarDatePicker bind:dates={adding} {locale} />
					<Button variant="dashed" type="submit" disabled={adding.length === 0}>
						<Plus size={14} />{m.addDate()}
					</Button>
				</form>
			{/if}
		{/if}
	</section>
{/key}
