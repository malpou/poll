<script lang="ts">
	import ResponsePage from '$lib/components/organisms/ResponsePage.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<ResponsePage {data} />
