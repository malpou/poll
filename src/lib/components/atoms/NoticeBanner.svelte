<script lang="ts">
	// Dot-prefixed status strip (poll closed/cancelled, new dates pending).
	let {
		text,
		tone = 'amber',
		class: cls = ''
	}: {
		text: string;
		tone?: 'amber' | 'primary';
		class?: string;
	} = $props();

	const tones = {
		amber: { box: 'border-border bg-amber-tint text-amber', dot: 'bg-amber' },
		primary: { box: 'border-primary bg-primary-tint text-primary', dot: 'bg-primary' }
	};
</script>

<div
	class="flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold {tones[tone]
		.box} {cls}"
>
	<span class="h-2 w-2 shrink-0 rounded-full {tones[tone].dot}"></span>
	{text}
</div>
