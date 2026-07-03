<script lang="ts">
	import CreatePage from '$lib/components/templates/CreatePage.svelte';
	import HreflangLinks from '$lib/components/atoms/HreflangLinks.svelte';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
</script>

<HreflangLinks path="/create" />

<CreatePage
	{form}
	suggestedLocale={data.suggestedLocale}
	suggestedAccent={data.suggestedAccent}
	hintLocale={data.hintLocale}
/>
