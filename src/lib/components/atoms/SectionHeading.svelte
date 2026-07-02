<script lang="ts">
	let { text, class: cls = '' }: { text: string; class?: string } = $props();
</script>

<div class="text-caption font-bold uppercase tracking-[0.06em] text-ink-muted {cls}">
	{text}
</div>
