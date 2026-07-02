<script lang="ts">
	let { text, class: cls = '' }: { text: string; class?: string } = $props();
</script>

<div class="text-2xs font-bold uppercase tracking-widest text-ink-muted {cls}">
	{text}
</div>
