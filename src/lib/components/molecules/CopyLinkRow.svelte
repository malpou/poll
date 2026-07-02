<script lang="ts">
	import LinkChip from '$lib/components/atoms/LinkChip.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import { Copy } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';

	let {
		url,
		oncopied,
		class: cls = ''
	}: {
		url: string;
		// Fires after the url is written to the clipboard (show a toast here).
		oncopied?: () => void;
		class?: string;
	} = $props();

	function copy() {
		void navigator.clipboard.writeText(url).catch(() => undefined);
		oncopied?.();
	}
</script>

<div class="flex items-center gap-2.5 {cls}">
	<LinkChip text={url.replace(/^https?:\/\//, '')} />
	<!-- Icon-only per DESIGN.md; the aria-label keeps the full name. -->
	<Button variant="ghost" iconOnly label={m.copyLink()} onclick={copy}>
		<Copy size={16} />
	</Button>
</div>
