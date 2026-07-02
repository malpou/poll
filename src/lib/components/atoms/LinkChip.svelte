<script lang="ts">
	let { text }: { text: string } = $props();
</script>

<div
	class="min-w-45 flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-control border-2 border-border bg-card-alt px-3 py-2 text-caption text-ink-muted"
>
	{text}
</div>
