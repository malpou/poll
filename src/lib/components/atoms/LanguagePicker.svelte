<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { locales, langLabel } from '$lib/logic/locales';
	import { FLAG_SVG } from './flags';
	import type { Locale } from '$lib/types';

	// Circular flag swatches, styled like the accent picker. Each radio keeps the
	// language's native name as its accessible label (stable across UI locale).
	let {
		value = $bindable(),
		name = 'locale',
		showLegend = true,
		onpick,
		class: cls = ''
	}: {
		value: Locale;
		name?: string;
		showLegend?: boolean;
		onpick?: (l: Locale) => void;
		class?: string;
	} = $props();
</script>

<fieldset class="flex flex-col gap-2 {cls}">
	<legend
		class={showLegend ? 'text-2xs font-bold uppercase tracking-widest text-ink-muted' : 'sr-only'}
		>{m.fieldLanguage()}</legend
	>
	<div class="flex flex-wrap items-center gap-3">
		{#each locales as l (l)}
			<label class="relative cursor-pointer" title={langLabel(l, l)}>
				<!-- The input overlays the swatch invisibly so it stays clickable and
				     focusable (same trick as the accent picker). -->
				<input
					type="radio"
					{name}
					value={l}
					bind:group={value}
					onchange={() => onpick?.(l)}
					class="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
				/>
				<span
					class="block h-7 w-7 overflow-hidden rounded-full border-2 border-border-strong transition peer-checked:border-ink peer-checked:ring-2 peer-checked:ring-ink peer-checked:ring-offset-2 peer-checked:ring-offset-card peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2"
				>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- static inlined SVGs -->
					{@html FLAG_SVG[l]}
				</span>
				<span class="sr-only">{langLabel(l, l)}</span>
			</label>
		{/each}
	</div>
</fieldset>
