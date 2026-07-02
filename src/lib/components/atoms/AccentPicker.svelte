<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { ACCENTS, type Accent } from '$lib/types';

	let {
		value = $bindable('yellow'),
		name = 'accent',
		showLegend = true,
		onpick,
		class: cls = ''
	}: {
		value?: Accent;
		name?: string;
		showLegend?: boolean;
		onpick?: (a: Accent) => void;
		class?: string;
	} = $props();

	const labels: Record<Accent, () => string> = {
		yellow: m.accentYellow,
		pink: m.accentPink,
		green: m.accentGreen,
		blue: m.accentBlue,
		purple: m.accentPurple
	};
</script>

<fieldset class="flex flex-col gap-2 {cls}">
	<legend
		class={showLegend ? 'text-2xs font-bold uppercase tracking-widest text-ink-muted' : 'sr-only'}
		>{m.fieldAccent()}</legend
	>
	<div class="flex flex-wrap items-center gap-3">
		<!-- Each swatch paints itself via its own data-accent → --hl; the chosen
		     hexes never appear in markup. -->
		{#each ACCENTS as a (a)}
			<label data-accent={a} class="relative cursor-pointer">
				<!-- The input overlays the swatch invisibly so it stays clickable and
				     focusable (sr-only would make it unreachable for pointer tools). -->
				<input
					type="radio"
					{name}
					value={a}
					bind:group={value}
					onchange={() => onpick?.(a)}
					class="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
				/>
				<span
					class="block h-7 w-7 rounded-full border-2 border-border-strong bg-hl transition peer-checked:border-ink peer-checked:ring-2 peer-checked:ring-ink peer-checked:ring-offset-2 peer-checked:ring-offset-card peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2"
				></span>
				<span class="sr-only">{labels[a]()}</span>
			</label>
		{/each}
	</div>
</fieldset>
