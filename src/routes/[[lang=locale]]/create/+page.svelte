<script lang="ts">
	import CreatePage from '$lib/components/templates/CreatePage.svelte';
	import HreflangLinks from '$lib/components/atoms/HreflangLinks.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
</script>

<svelte:head><title>{m.createTitle()} · {m.appName()}</title></svelte:head>
<HreflangLinks path="/create" />

<CreatePage {form} suggestedLocale={data.suggestedLocale} suggestedAccent={data.suggestedAccent} />
