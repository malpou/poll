<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { tzLabel } from '$lib/logic/date';
	import type { Locale } from '$lib/types';

	let {
		name,
		value = $bindable(),
		locale,
		onpick
	}: {
		name: string;
		value: string;
		locale: Locale;
		onpick?: () => void;
	} = $props();

	const zones = Intl.supportedValuesOf('timeZone');
	const uid = $props.id();

	// null = not filtering; the input shows the selected zone's label. Any typed
	// text lives here until it's committed via a pick or discarded on blur/Esc,
	// so `value` only ever holds a real IANA id.
	let query = $state<string | null>(null);
	let open = $state(false);
	let active = $state(0);
	let listEl: HTMLUListElement | undefined = $state();

	const text = $derived(query ?? tzLabel(value, locale));
	const matches = $derived.by(() => {
		if (query === null) return zones;
		const q = query.toLowerCase();
		return zones.filter((tz) => tzLabel(tz, locale).toLowerCase().includes(q));
	});

	function pick(tz: string) {
		value = tz;
		query = null;
		open = false;
		onpick?.();
	}
	function close() {
		query = null; // ponytail: blur-revert — invalid text can never linger, the hidden input never held it
		open = false;
	}
	function move(delta: number) {
		open = true;
		active = Math.max(0, Math.min(matches.length - 1, active + delta));
		listEl?.children[active]?.scrollIntoView({ block: 'nearest' });
	}
	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			move(1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			move(-1);
		} else if (e.key === 'Enter' && open) {
			e.preventDefault(); // pick, don't submit the surrounding form
			if (matches[active]) pick(matches[active]);
		} else if (e.key === 'Escape' && open) {
			e.stopPropagation(); // closing the list shouldn't cancel an edit form
			close();
		}
	}
</script>

<label class="relative flex flex-col gap-2">
	<span class="text-2xs font-bold uppercase tracking-widest text-ink-muted"
		>{m.fieldTimezone()}</span
	>
	<input
		type="text"
		role="combobox"
		autocomplete="off"
		aria-expanded={open}
		aria-controls="{uid}-listbox"
		aria-activedescendant={open ? `${uid}-option-${String(active)}` : undefined}
		value={text}
		oninput={(e) => {
			query = e.currentTarget.value;
			open = true;
			active = 0;
		}}
		onfocus={(e) => {
			e.currentTarget.select();
			open = true;
			active = Math.max(0, matches.indexOf(value));
		}}
		{onkeydown}
		onblur={close}
		class="h-11.5 w-full rounded-control border-2 border-border-strong bg-card-alt px-3.5 text-body text-ink outline-none focus:border-ink"
	/>
	<input type="hidden" {name} {value} />
	{#if open && matches.length > 0}
		<ul
			bind:this={listEl}
			id="{uid}-listbox"
			role="listbox"
			aria-label={m.fieldTimezone()}
			class="absolute top-full z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-control border-2 border-border bg-card-alt py-1"
		>
			{#each matches as tz, i (tz)}
				<!-- pointerdown beats the input's blur; preventDefault keeps focus there -->
				<li
					id="{uid}-option-{i}"
					role="option"
					aria-selected={tz === value}
					onpointerdown={(e) => {
						e.preventDefault();
						pick(tz);
					}}
					class="cursor-pointer px-3.5 py-2 text-body text-ink {i === active ? 'bg-hl-tint' : ''}"
				>
					{tzLabel(tz, locale)}
				</li>
			{/each}
		</ul>
	{/if}
</label>
