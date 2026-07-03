<script lang="ts">
	// One RSVP headcount row (coming / not coming / pending), shared by the
	// organizer dashboard and the participant outcome view so both render the
	// headcount the same way; the names line is organizer-only.
	let { label, count, names = [] }: { label: string; count: number; names?: string[] } = $props();
</script>

<div class="rounded-card border-2 border-border bg-card-alt p-4">
	<div class="flex items-baseline gap-2.5">
		<span class="text-lead font-bold text-ink">{label}</span>
		<span class="text-body font-semibold text-ink-soft">{count}</span>
	</div>
	{#if names.length > 0}
		<p class="mt-1 text-caption text-ink-muted">{names.join(', ')}</p>
	{/if}
</div>
