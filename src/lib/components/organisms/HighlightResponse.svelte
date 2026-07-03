<script lang="ts">
	import { fly } from 'svelte/transition';
	import { Minus } from '@lucide/svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import { flyIn } from '$lib/motion';
	import { m } from '$lib/paraglide/messages';
	import type { ResponseDateView } from '$lib/types';

	// The highlight answering list (openspec/specs/highlight-poll): tapping an
	// option runs the poll's marker across its text, once per stroke, until the
	// budget is spent; strokes can be taken back. Counts post as value.{id},
	// zeros included, so the server sees the full current option set.
	let {
		options,
		budget,
		values = {},
		readOnly = false,
		onchange
	}: {
		options: ResponseDateView[];
		budget: number;
		// The invitee's recorded stroke counts, keyed by option id.
		values?: Record<string, number>;
		readOnly?: boolean;
		// Fires with the counts after every stroke: the parent's submit gating
		// and the landing demo's tally both hang off it.
		onchange?: (counts: Record<string, number>) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	let counts = $state<Record<string, number>>(
		Object.fromEntries(options.map((o) => [o.id, values[o.id] ?? 0]))
	);
	const total = $derived(Object.values(counts).reduce((a, b) => a + b, 0));
	const remaining = $derived(budget - total);

	function add(id: string) {
		if (readOnly || remaining <= 0) return;
		counts[id]++;
		onchange?.({ ...counts });
	}
	function removeOne(id: string) {
		if (readOnly || counts[id] <= 0) return;
		counts[id]--;
		onchange?.({ ...counts });
	}

	// One hl-swipe-style band per stroke, each pass nudged upward a little so
	// repeated runs read as separate marker strokes; the translucent layers
	// deepen where they overlap (color-mix per DESIGN.md, wrap-safe).
	function strokeBands(count: number): string {
		const bands: string[] = [];
		for (let i = 0; i < count; i++) {
			const top = String(Math.max(12, 55 - i * 8));
			const bottom = String(Math.min(100, 94 + i * 1.5));
			bands.push(
				`linear-gradient(to bottom, transparent ${top}%, color-mix(in oklab, var(--hl) 45%, transparent) ${top}%, color-mix(in oklab, var(--hl) 45%, transparent) ${bottom}%, transparent ${bottom}%)`
			);
		}
		return bands.join(', ');
	}
</script>

<div class="flex flex-col gap-3.5">
	<!-- Marker-cap dots that deplete as strokes are spent, plus the running
	     count for screen readers and anyone counting. -->
	<div class="flex flex-wrap items-center gap-3">
		<div class="flex flex-wrap gap-1.5" aria-hidden="true">
			{#each Array(budget), i}
				<span
					class="h-3.5 w-3.5 rounded-full border-2 {i < remaining
						? 'border-ink bg-hl'
						: 'border-border-strong'}"
				></span>
			{/each}
		</div>
		<span data-testid="strokes-left" aria-live="polite" class="text-caption text-ink-muted">
			{m.strokesLeft({ count: remaining, budget })}
		</span>
	</div>

	{#each options as opt, i (opt.id)}
		<div
			data-testid="highlight-card-{opt.id}"
			in:fly={flyIn(i)}
			class="flex flex-col gap-1 rounded-card border-2 border-border bg-card-alt p-4"
		>
			{#if opt.needsAnswer}
				<span
					class="mb-1 w-fit whitespace-nowrap rounded-full bg-hl px-2.5 py-1 text-2xs font-bold text-ink"
				>
					{m.newDateBadge()}
				</span>
			{/if}
			<div class="flex items-center gap-3">
				<button
					type="button"
					onclick={() => add(opt.id)}
					disabled={readOnly || remaining <= 0}
					aria-label={m.addStroke({ option: opt.label })}
					class="min-w-0 flex-1 cursor-pointer py-1 text-left disabled:cursor-not-allowed"
				>
					<span
						class="hl-strokes text-lead font-bold text-ink"
						style:background-image={strokeBands(counts[opt.id])}>{opt.label}</span
					>
				</button>
				{#if counts[opt.id] > 0}
					<!-- The spent strokes as marker-cap circles, mirroring the budget
					     indicator above; the count itself is kept for assistive tech. -->
					<div
						data-testid="stroke-dots-{opt.id}"
						class="flex shrink-0 flex-wrap items-center justify-end gap-1.5"
						aria-hidden="true"
					>
						{#each Array(counts[opt.id])}
							<span class="h-3.5 w-3.5 rounded-full border-2 border-ink bg-hl"></span>
						{/each}
					</div>
					<span data-testid="stroke-count-{opt.id}" class="sr-only">
						{m.strokesTotal({ count: counts[opt.id] })}
					</span>
					{#if !readOnly}
						<Button
							variant="ghost"
							iconOnly
							label={m.removeStroke({ option: opt.label })}
							onclick={() => removeOne(opt.id)}><Minus size={16} /></Button
						>
					{/if}
				{/if}
			</div>
			<input type="hidden" name="value.{opt.id}" value={counts[opt.id]} />
		</div>
	{/each}
</div>
