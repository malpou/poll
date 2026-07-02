<script lang="ts">
	let {
		label,
		name,
		value = $bindable(),
		type = 'text',
		placeholder,
		compact = false
	}: {
		label?: string;
		name?: string;
		value: string;
		type?: 'text' | 'date' | 'time';
		placeholder?: string;
		compact?: boolean;
	} = $props();
</script>

<label class="flex min-w-0 flex-1 flex-col gap-2">
	{#if label}
		<span class="text-sm font-semibold text-ink">{label}</span>
	{/if}
	<input
		{type}
		{name}
		{placeholder}
		bind:value
		class="w-full rounded-control border border-border bg-card px-3.5 text-body text-ink outline-none placeholder:text-ink-muted/70 focus:border-primary {compact
			? 'h-10'
			: 'h-11.5'}"
	/>
</label>
