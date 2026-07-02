<script lang="ts">
	import ResponsePage from '$lib/components/templates/ResponsePage.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head
	><title>{data.invalid ? m.linkNotFound() : data.title} · {m.appName()}</title></svelte:head
>

<ResponsePage {data} />
