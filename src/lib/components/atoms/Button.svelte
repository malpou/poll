<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'primary',
		type = 'button',
		onclick,
		children
	}: {
		variant?: 'primary' | 'dashed' | 'ghost';
		type?: 'button' | 'submit';
		onclick?: () => void;
		children: Snippet;
	} = $props();

	const variants = {
		primary: 'h-[50px] px-6 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover',
		dashed:
			'mt-2.5 h-[42px] px-4 rounded-[10px] border border-dashed border-border text-primary font-semibold hover:bg-primary-tint hover:border-primary',
		ghost:
			'h-9 px-3.5 rounded-[9px] border border-border bg-card text-primary text-[13px] font-semibold hover:bg-primary-tint'
	};
</script>

<button
	{type}
	{onclick}
	class="cursor-pointer text-[15px] transition-colors duration-150 {variants[variant]}"
>
	{@render children()}
</button>
