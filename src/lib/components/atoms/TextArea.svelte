<script lang="ts">
	let {
		label,
		name,
		value = $bindable(),
		rows = 3,
		placeholder,
		disabled = false
	}: {
		label?: string;
		name?: string;
		value: string;
		rows?: number;
		placeholder?: string;
		disabled?: boolean;
	} = $props();
</script>

<label class="flex flex-col gap-2">
	{#if label}
		<span class="text-2xs font-bold uppercase tracking-widest text-ink-muted">{label}</span>
	{/if}
	<textarea
		{rows}
		{name}
		{placeholder}
		{disabled}
		bind:value
		class="min-h-21 w-full resize-none rounded-card border-2 border-border-strong bg-card-alt px-3.5 py-3 text-body leading-normal text-ink outline-none placeholder:text-ink-faint focus:border-ink disabled:cursor-not-allowed disabled:opacity-70"
	></textarea>
</label>
