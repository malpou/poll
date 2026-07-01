<script lang="ts">
	import CreateEventForm from '$lib/components/organisms/CreateEventForm.svelte';
	import { da } from '$lib/da';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>{da.createTitle} · {da.appName}</title></svelte:head>

<CreateEventForm {form} />
