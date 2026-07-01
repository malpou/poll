<script lang="ts">
	let {
		onclick,
		label,
		type = 'button',
		children
	}: {
		onclick?: () => void;
		label: string;
		type?: 'button' | 'submit';
		children: import('svelte').Snippet;
	} = $props();
</script>

<button
	{type}
	{onclick}
	aria-label={label}
	class="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[9px] bg-card-alt text-[13px] text-ink-muted transition-colors duration-150 hover:bg-bad-tint hover:text-bad"
>
	{@render children()}
</button>
