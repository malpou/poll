<script lang="ts">
	let {
		label,
		name,
		value = $bindable(),
		type = 'text',
		placeholder,
		compact = false,
		min,
		max
	}: {
		label?: string;
		name?: string;
		value: string;
		type?: 'text' | 'date' | 'time' | 'number';
		placeholder?: string;
		compact?: boolean;
		min?: number;
		max?: number;
	} = $props();
</script>

<label class="flex min-w-0 flex-1 flex-col gap-2">
	{#if label}
		<span class="text-2xs font-bold uppercase tracking-widest text-ink-muted">{label}</span>
	{/if}
	<input
		{type}
		{name}
		{placeholder}
		{min}
		{max}
		bind:value
		class="w-full border-b-2 border-border-strong bg-transparent px-0.5 text-body text-ink outline-none placeholder:text-ink-faint focus:border-ink {compact
			? 'h-10'
			: 'h-11.5'}"
	/>
</label>
