<script lang="ts">
	// Dot-prefixed status strip (poll closed/cancelled, new dates pending).
	let {
		text,
		tone = 'hl',
		class: cls = ''
	}: {
		text: string;
		tone?: 'hl' | 'ink';
		class?: string;
	} = $props();

	const tones = {
		hl: { box: 'border-border bg-hl-tint text-ink', dot: 'bg-hl' },
		ink: { box: 'border-border-strong bg-card-alt text-ink', dot: 'bg-ink' }
	};
</script>

<div
	class="flex items-center gap-2.5 rounded-card border-2 px-4 py-3 text-sm font-semibold {tones[
		tone
	].box} {cls}"
>
	<span class="h-2 w-2 shrink-0 rounded-full {tones[tone].dot}"></span>
	{text}
</div>
