<script lang="ts">
	import OrganizerDashboard from '$lib/components/organisms/OrganizerDashboard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<OrganizerDashboard {data} />
