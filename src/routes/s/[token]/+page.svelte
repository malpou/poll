<script lang="ts">
	import ResponsePage from '$lib/components/templates/ResponsePage.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head
	><title>{data.invalid ? m.linkNotFound() : data.title} · {m.appName()}</title>
	<!-- Capability URLs: keep token pages out of search indexes (PROJECT.md). -->
	<meta name="robots" content="noindex" /></svelte:head
>

<ResponsePage {data} mode="open" action="?/submit" />
