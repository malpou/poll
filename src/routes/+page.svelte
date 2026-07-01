<script lang="ts">
	import CreateEventForm from '$lib/components/organisms/CreateEventForm.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<CreateEventForm {form} />
