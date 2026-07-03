<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from '$lib/motion';
	import { m } from '$lib/paraglide/messages';

	// One option's rank/highlight result summary, the value-poll counterpart of
	// ResultBars: one caption (average position / stroke total) over the same
	// growing bar - highlight fills by its share of all strokes, rank by how
	// close its average position is to first place. The organizer additionally
	// sees each respondent's value as a pill. Participant outcome views pass
	// no names.
	let {
		kind,
		avgPosition = null,
		valueSum,
		sharePct = 0,
		names = []
	}: {
		kind: 'rank' | 'highlight';
		avgPosition?: number | null;
		valueSum: number;
		sharePct?: number;
		names?: { name: string; value: number }[];
	} = $props();

	// Same mount-grow as ResultBars (DESIGN.md: ~450ms ease-out, scaleX).
	const reduced = prefersReducedMotion();
	let revealed = $state(reduced);
	onMount(() => {
		if (!revealed) requestAnimationFrame(() => (revealed = true));
	});
</script>

<div class="flex flex-col gap-2.5">
	<div class="flex flex-wrap gap-x-3.5 gap-y-0.5 text-caption text-ink-muted">
		{#if kind === 'rank'}
			<span>
				{avgPosition === null
					? m.averagePosition({ avg: '-' })
					: m.averagePosition({ avg: avgPosition.toFixed(1) })}
			</span>
		{:else}
			<span>{m.strokesTotal({ count: valueSum })}</span>
		{/if}
	</div>

	<div class="h-2.5 overflow-hidden rounded-full bg-wash">
		<div
			class="flex h-full origin-left"
			style="transform:scaleX({revealed ? 1 : 0}); transition:{reduced
				? 'none'
				: 'transform 450ms cubic-bezier(0,0,.2,1)'};"
		>
			<div class="h-full bg-hl" style="width:{sharePct}%"></div>
		</div>
	</div>

	{#if names.length > 0}
		<div class="flex flex-wrap gap-1.5">
			{#each names as nk (nk.name)}
				<!-- #position / ×strokes are locale-neutral symbols; the sr-only text
				     spells them out. -->
				<span
					class="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-border-strong px-2.5 py-1 text-xs text-ink"
				>
					{nk.name}
					<span class="font-bold" aria-hidden="true">
						{kind === 'rank' ? `#${String(nk.value)}` : `×${String(nk.value)}`}
					</span>
					<span class="sr-only">
						{kind === 'rank'
							? m.positionLabel({ position: nk.value })
							: m.strokesTotal({ count: nk.value })}
					</span>
				</span>
			{/each}
		</div>
	{/if}
</div>
