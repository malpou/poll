<script lang="ts">
	import { m } from '$lib/paraglide/messages';
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-10 text-center">
	<div class="h-[52px] w-[52px] rotate-45 rounded-[14px] border border-border bg-card-alt"></div>
	<h1 class="mt-3 text-2xl font-extrabold tracking-[-0.01em] text-ink">{m.linkNotFound()}</h1>
	<p class="max-w-[300px] text-[15px] leading-relaxed text-ink-muted">{m.linkNotFoundSub()}</p>
</div>
