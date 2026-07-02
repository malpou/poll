<script lang="ts">
	import { m } from '$lib/paraglide/messages';
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-10 text-center">
	<div class="h-13 w-13 rotate-45 rounded-cta border-2 border-border-strong bg-card-alt"></div>
	<h1 class="mt-3 text-2xl font-bold text-ink"><span class="hl-swipe">{m.linkNotFound()}</span></h1>
	<p class="max-w-75 text-body leading-relaxed text-ink-muted">{m.linkNotFoundSub()}</p>
</div>
