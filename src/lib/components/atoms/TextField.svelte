<script lang="ts">
	let {
		label,
		value = $bindable(),
		type = 'text',
		placeholder,
		compact = false
	}: {
		label?: string;
		value: string;
		type?: 'text' | 'date' | 'time';
		placeholder?: string;
		compact?: boolean;
	} = $props();
</script>

<label class="flex flex-1 flex-col gap-2">
	{#if label}
		<span class="text-sm font-semibold text-ink">{label}</span>
	{/if}
	<input
		{type}
		{placeholder}
		bind:value
		class="w-full rounded-[10px] border border-border bg-card px-3.5 text-[15px] text-ink outline-none placeholder:text-ink-muted/70 focus:border-primary {compact
			? 'h-10'
			: 'h-[46px]'}"
	/>
</label>
