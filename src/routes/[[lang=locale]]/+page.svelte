<script lang="ts">
	import { browser } from '$app/environment';
	import { replaceState } from '$app/navigation';
	import AccentPicker from '$lib/components/atoms/AccentPicker.svelte';
	import HreflangLinks from '$lib/components/atoms/HreflangLinks.svelte';
	import LanguagePicker from '$lib/components/atoms/LanguagePicker.svelte';
	import LocaleSwap from '$lib/components/atoms/LocaleSwap.svelte';
	import SectionHeading from '$lib/components/atoms/SectionHeading.svelte';
	import LandingExamples from '$lib/components/organisms/LandingExamples.svelte';
	import LandingPoker from '$lib/components/organisms/LandingPoker.svelte';
	import { m } from '$lib/paraglide/messages';
	import { langLabel } from '$lib/logic/locales';
	import { createUrl, landingUrl } from '$lib/logic/site-urls';
	import { ArrowRight, X } from '@lucide/svelte';
	import type { Accent, Locale } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// The landing highlighter previews live (data-accent below) and rides the
	// ?accent= query into the URL, language switches, and the create
	// call-to-action.
	// svelte-ignore state_referenced_locally
	let accent = $state<Accent>(data.accent);

	// The page's language; seeded from the URL segment, the picker owns it
	// afterwards.
	// svelte-ignore state_referenced_locally
	let locale = $state<Locale>(data.pageLocale);

	// Live language switch, same trick as the create form: <html lang> flips
	// first (m.*() reads it on the client), then the {#key locale} re-render
	// repaints every string; the URL follows shallowly - no page load.
	const pickLocale = (next: Locale) => {
		document.documentElement.lang = next;
		replaceState(landingUrl(next, accent), {});
		locale = next;
	};

	// The hint is dismissible for the session (sessionStorage). It is hidden
	// during SSR and appears after hydration, so a dismissal never flashes.
	let hintDismissed = $derived(!browser || sessionStorage.getItem('langHintDismissed') === '1');
	function dismissHint() {
		sessionStorage.setItem('langHintDismissed', '1');
		hintDismissed = true;
	}
</script>

<svelte:head>
	{#key locale}
		<title>{m.appName()} · {m.landingTitle()}</title>
	{/key}
</svelte:head>
<HreflangLinks />

<div data-accent={accent} data-testid="landing-root" class="mx-auto max-w-160 px-4 pb-18 pt-7">
	{#if data.hintLocale && data.hintLocale !== locale && !hintDismissed}
		{@const hl = data.hintLocale}
		<div
			data-testid="lang-hint"
			class="mb-4 flex items-center gap-2.5 rounded-card border-2 border-border bg-card-alt px-4 py-3 text-sm font-semibold text-ink"
		>
			<span class="h-2 w-2 shrink-0 rounded-full bg-ink"></span>
			<!-- Written in the browser's language; picking it flips the page's
			     language in place - the same live switch the picker does, no reload. -->
			<button
				type="button"
				onclick={() => pickLocale(hl)}
				class="cursor-pointer text-left underline hover:no-underline"
			>
				{m.landingHintLink(
					{ language: langLabel(data.hintLocale, data.hintLocale) },
					{ locale: data.hintLocale }
				)}
			</button>
			<button
				type="button"
				onclick={dismissHint}
				aria-label={m.landingHintDismiss({}, { locale: data.hintLocale })}
				class="ml-auto cursor-pointer text-ink-muted transition-colors duration-150 hover:text-ink"
			>
				<X size={16} aria-hidden="true" />
			</button>
		</div>
	{/if}

	<div class="paper-sheet">
		<!-- Corner pickers, mirroring the create page: accent top-left previews
		     this page live (and syncs the ?accent= query), language top-right
		     navigates to that language's URL. -->
		<div class="mb-6 flex items-start justify-between gap-12">
			{#key locale}
				<AccentPicker
					bind:value={accent}
					showLegend={false}
					onpick={(a: Accent) => replaceState(landingUrl(locale, a), {})}
				/>
			{/key}
			<LanguagePicker bind:value={locale} onpick={pickLocale} showLegend={false} alignEnd />
		</div>

		<!-- Re-render every m.*() under the newly picked locale. -->
		<LocaleSwap {locale}>
			<h1 class="mb-3 text-title font-bold text-ink">
				<span class="hl-swipe">{m.landingTitle()}</span>
			</h1>
			<p class="mb-3 max-w-prose text-body leading-relaxed text-ink-soft">{m.landingIntro()}</p>
			<p class="mb-8 max-w-prose text-body leading-relaxed text-ink-soft">
				{m.landingIntroTypes()}
			</p>

			<!-- Crawlable create call-to-action; mirrors the Button atom's primary look. -->
			<a
				href={createUrl(locale, accent)}
				class="inline-flex h-13 w-full cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-cta bg-ink px-6 text-body font-bold tracking-wider text-card transition duration-150 hover:-translate-y-0.5 hover:bg-primary-hover"
			>
				{m.createTitle()}
				<ArrowRight size={17} aria-hidden="true" />
			</a>

			<!-- Planning poker leads the body: it is the newest capability and the
			     one nobody is looking for yet, so it sits above the examples rather
			     than after them. Solid rules on both sides - a harder break than the
			     dashed one between poll sections, because this is a different tool,
			     not another poll type. -->
			<hr class="my-9 border-t-2 border-ink-faint" />

			<LandingPoker {locale} {accent} />

			<hr class="my-9 border-t-2 border-dashed border-border" />

			<div class="mb-2"><SectionHeading text={m.landingExamplesTitle()} /></div>
			<p class="mb-6 max-w-prose text-caption text-ink-muted">{m.landingExamplesHint()}</p>
			<LandingExamples {locale} samples={data.samples} />
		</LocaleSwap>
	</div>
</div>
