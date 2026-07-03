<script lang="ts">
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
	import { ChevronDown, ChevronUp, GripVertical } from '@lucide/svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import { flipParams, flyIn } from '$lib/motion';
	import { m } from '$lib/paraglide/messages';
	import type { ResponseDateView } from '$lib/types';

	// The rank answering list (openspec/specs/rank-poll): paper slips the invitee
	// puts in a strict total order, by dragging the handle or with the move
	// buttons (the keyboard/touch-safe path). Positions post as value.{id}.
	let {
		options,
		readOnly = false,
		onreorder
	}: {
		// In the order the invitee last recorded, or the organizer's order.
		options: ResponseDateView[];
		readOnly?: boolean;
		// Fires with the new id order after every move (the landing demo's tally).
		onreorder?: (ids: string[]) => void;
	} = $props();

	// Working order, seeded once from the load (navigation remounts).
	// svelte-ignore state_referenced_locally
	let ordered = $state(options.map((o) => o.id));
	// svelte-ignore state_referenced_locally
	const byId = new Map(options.map((o) => [o.id, o]));

	function move(id: string, delta: number) {
		const from = ordered.indexOf(id);
		const to = from + delta;
		if (to < 0 || to >= ordered.length) return;
		const next = [...ordered];
		next.splice(from, 1);
		next.splice(to, 0, id);
		ordered = next;
		onreorder?.(next);
	}

	// Pointer drag starts on the handle only, so touch scrolling elsewhere on
	// the page is never hijacked. While dragging, crossing another slip's
	// midpoint moves the lifted slip there and the flip transition glides the
	// rest into place. Move/up are tracked on the window, not via pointer
	// capture: the flip reorder moves the handle in the DOM mid-drag, which
	// drops capture and would leave the slip stuck lifted when the pointer is
	// released outside it.
	let dragging = $state<string | null>(null);
	let els: Record<string, HTMLDivElement | undefined> = {};

	function dragStart(e: PointerEvent, id: string) {
		if (readOnly) return;
		e.preventDefault();
		dragging = id;
	}
	function dragMove(e: PointerEvent) {
		if (!dragging) return;
		const from = ordered.indexOf(dragging);
		for (let i = 0; i < ordered.length; i++) {
			if (i === from) continue;
			const r = els[ordered[i]]?.getBoundingClientRect();
			if (!r) continue;
			const mid = r.top + r.height / 2;
			if ((i < from && e.clientY < mid) || (i > from && e.clientY > mid)) {
				move(dragging, i - from);
				break;
			}
		}
	}
	function dragEnd() {
		dragging = null;
	}
</script>

<svelte:window onpointermove={dragMove} onpointerup={dragEnd} onpointercancel={dragEnd} />

<div class="flex flex-col gap-3.5">
	{#each ordered as id, i (id)}
		{@const opt = byId.get(id) ?? options[i]}
		<div
			bind:this={els[id]}
			data-testid="rank-slip-{id}"
			in:fly={flyIn(i)}
			animate:flip={flipParams()}
			class="flex items-center gap-3 rounded-card border-2 border-border bg-card-alt p-4 {dragging ===
			id
				? 'slip-lifted'
				: ''}"
		>
			<!-- The grip and the position numeral together are the drag handle, so
			     the whole left region grabs the slip (not just the small grip). Still
			     handle-only, so vertical touch-scroll elsewhere on the card is never
			     hijacked. -->
			{#snippet numeral()}
				<span
					aria-hidden="true"
					class="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-ink text-2xs font-bold text-ink"
				>
					{i + 1}
				</span>
			{/snippet}
			{#if !readOnly}
				<button
					type="button"
					aria-label={m.dragToReorder()}
					onpointerdown={(e) => dragStart(e, id)}
					class="-my-2 -ml-2 flex shrink-0 touch-none items-center gap-3 py-2 pl-2 text-ink-muted {dragging ===
					id
						? 'cursor-grabbing'
						: 'cursor-grab'}"
				>
					<GripVertical size={16} aria-hidden="true" />
					{@render numeral()}
				</button>
			{:else}
				{@render numeral()}
			{/if}
			<span class="sr-only">{m.positionLabel({ position: i + 1 })}</span>
			<div class="flex min-w-0 flex-col gap-1">
				{#if opt.needsAnswer}
					<span
						class="w-fit whitespace-nowrap rounded-full bg-hl px-2.5 py-1 text-2xs font-bold text-ink"
					>
						{m.newDateBadge()}
					</span>
				{/if}
				<span class="text-lead font-bold text-ink">{opt.label}</span>
			</div>
			{#if !readOnly}
				<div class="ml-auto flex shrink-0 items-center gap-2">
					<Button
						variant="ghost"
						iconOnly
						label={m.moveUp()}
						disabled={i === 0}
						onclick={() => move(id, -1)}><ChevronUp size={16} /></Button
					>
					<Button
						variant="ghost"
						iconOnly
						label={m.moveDown()}
						disabled={i === ordered.length - 1}
						onclick={() => move(id, 1)}><ChevronDown size={16} /></Button
					>
				</div>
			{/if}
			<input type="hidden" name="value.{id}" value={i + 1} />
		</div>
	{/each}
</div>
