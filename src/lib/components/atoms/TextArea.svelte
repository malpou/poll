<script lang="ts">
	let {
		label,
		name,
		value = $bindable(),
		rows = 3
	}: {
		label?: string;
		name?: string;
		value: string;
		rows?: number;
	} = $props();
</script>

<label class="flex flex-col gap-2">
	{#if label}
		<span class="text-sm font-semibold text-ink">{label}</span>
	{/if}
	<textarea
		{rows}
		{name}
		bind:value
		class="min-h-[84px] w-full resize-none rounded-[10px] border border-border bg-card px-3.5 py-3 text-[15px] leading-normal text-ink outline-none placeholder:text-ink-muted/70 focus:border-primary"
	></textarea>
</label>
