<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		name,
		value,
		onchange,
		children
	}: {
		label?: string;
		name?: string;
		value: string;
		onchange?: (value: string) => void;
		children: Snippet;
	} = $props();
</script>

<label class="flex flex-col gap-2">
	{#if label}
		<span class="text-2xs font-bold uppercase tracking-widest text-ink-muted">{label}</span>
	{/if}
	<select
		{name}
		{value}
		onchange={(e) => onchange?.(e.currentTarget.value)}
		class="h-11.5 w-full rounded-control border-2 border-border-strong bg-card-alt px-3.5 text-body text-ink outline-none focus:border-ink"
	>
		{@render children()}
	</select>
</label>
