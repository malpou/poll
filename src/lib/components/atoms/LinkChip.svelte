<script lang="ts">
	let { text }: { text: string } = $props();
</script>

<div
	class="min-w-[180px] flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-lg bg-card-alt px-3 py-2 text-[13px] text-ink-muted"
>
	{text}
</div>
