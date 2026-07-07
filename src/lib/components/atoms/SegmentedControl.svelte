<script lang="ts">
	import { prefersReducedMotion, GLIDE } from '$lib/motion';
	import { m } from '$lib/paraglide/messages';
	import { Check, CircleQuestionMark, Star, X } from '@lucide/svelte';
	import type { PollType, Preference } from '$lib/types';

	let {
		value = $bindable(),
		choices = ['preferred', 'available', 'unavailable'],
		readOnly = false,
		pollType = 'dates'
	}: {
		value: Preference | undefined;
		// The event's enabled choices, in display order (see $lib/logic/choices).
		choices?: Preference[];
		readOnly?: boolean;
		// Question polls label the fixed pair in yes/no terms.
		pollType?: PollType;
	} = $props();

	// Signature interaction: one ink-bordered track, the indicator glides between
	// segments (~350ms soft overshoot; reduced motion → instant). Faces per
	// DESIGN.md: highlighter for preferred, gray wash for available, diagonal
	// ink hatch for unavailable, pencil dots for unsure - all four distinct.
	// Each segment stacks icon over label.
	const question = $derived(pollType === 'question');
	const rsvp = $derived(pollType === 'rsvp');
	const META = $derived<
		Record<Preference, { label: () => string; face: string; icon: typeof Star }>
	>({
		preferred: { label: m.prefPreferred, face: 'bg-hl', icon: Star },
		available: {
			label: rsvp ? m.prefAvailableRsvp : question ? m.prefAvailableQuestion : m.prefAvailable,
			face: 'bg-wash',
			icon: Check
		},
		unavailable: {
			label: rsvp
				? m.prefUnavailableRsvp
				: question
					? m.prefUnavailableQuestion
					: m.prefUnavailable,
			face: 'ink-hatch',
			icon: X
		},
		unsure: { label: m.prefUnsure, face: 'ink-dots', icon: CircleQuestionMark }
	});
	const options = $derived(
		choices.map((pref) => ({
			pref,
			...META[pref],
			// Without a Preferred choice, Available is the positive answer and
			// takes the highlighter face instead of the gray wash.
			face: pref === 'available' && !choices.includes('preferred') ? 'bg-hl' : META[pref].face
		}))
	);

	const reduced = prefersReducedMotion();
	const activeIndex = $derived(options.findIndex((o) => o.pref === value));

	function select(pref: Preference) {
		if (readOnly) return;
		value = pref;
	}
</script>

<div class="relative flex h-14 w-full overflow-hidden rounded-control border-2 border-ink">
	{#if activeIndex >= 0}
		<div
			class="pointer-events-none absolute bottom-0.75 top-0.75 rounded-lg {options[activeIndex]
				.face}"
			style="left:3px; width:calc((100% - 6px) / {options.length}); transform:translateX({activeIndex *
				100}%); transition:{reduced ? 'none' : GLIDE};"
		></div>
	{/if}
	{#each options as opt (opt.pref)}
		{@const active = value === opt.pref}
		<button
			type="button"
			disabled={readOnly}
			onclick={() => {
				select(opt.pref);
			}}
			aria-pressed={active}
			class="relative z-10 flex flex-1 flex-col items-center justify-center gap-0.75 border-none bg-transparent px-1 text-2xs transition-colors duration-150 {active
				? 'font-bold text-ink'
				: 'text-ink-muted'} {readOnly ? 'cursor-not-allowed' : 'cursor-pointer'}"
		>
			<!-- The preferred star fills when picked (DESIGN.md). -->
			<opt.icon
				size={14}
				class="shrink-0"
				fill={opt.pref === 'preferred' && active ? 'currentColor' : 'none'}
				aria-hidden="true"
			/>
			<span class={active && opt.pref === 'unavailable' ? 'line-through' : ''}>
				{opt.label()}
			</span>
		</button>
	{/each}
</div>
