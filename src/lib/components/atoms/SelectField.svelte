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
		<span class="text-sm font-semibold text-ink">{label}</span>
	{/if}
	<select
		{name}
		{value}
		onchange={(e) => onchange?.(e.currentTarget.value)}
		class="h-[46px] w-full rounded-[10px] border border-border bg-card px-3.5 text-[15px] text-ink outline-none focus:border-primary"
	>
		{@render children()}
	</select>
</label>
