<script lang="ts">
	import CreateEventForm from '$lib/components/organisms/CreateEventForm.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
</script>

<svelte:head><title>{m.createTitle()} · {m.appName()}</title></svelte:head>

<CreateEventForm {form} suggestedLocale={data.suggestedLocale} />
