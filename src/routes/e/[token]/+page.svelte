<script lang="ts">
	import OrganizerDashboard from '$lib/components/organisms/OrganizerDashboard.svelte';
	import { da } from '$lib/da';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head
	><title>{data.invalid ? da.linkNotFound : data.title} · {da.appName}</title></svelte:head
>

<OrganizerDashboard {data} />
