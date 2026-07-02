<script lang="ts">
	import { onMount } from 'svelte';
	import { Editor, Mark } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import { Baseline, Bold, Italic, List, ListOrdered } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';

	// Toned-down text. Serialized as attribute-free <small> (HTML's side-comment
	// element) so it passes the exact-token sanitizer; styled via .rich-text.
	const Muted = Mark.create({
		name: 'muted',
		parseHTML: () => [{ tag: 'small' }],
		renderHTML: () => ['small', 0]
	});

	let {
		label,
		name,
		value = $bindable()
	}: {
		label?: string;
		name?: string;
		value: string;
	} = $props();

	let element: HTMLDivElement;
	let editor = $state.raw<Editor>();
	// Editor isn't reactive; bumped per transaction so isActive() re-evaluates.
	let tick = $state(0);

	onMount(() => {
		const e = new Editor({
			element,
			// StarterKit ships more than we allow (link, underline, headings...);
			// keep only paragraph, bold, italic, lists, hard break, undo/redo.
			extensions: [
				StarterKit.configure({
					blockquote: false,
					code: false,
					codeBlock: false,
					heading: false,
					horizontalRule: false,
					link: false,
					strike: false,
					underline: false,
					dropcursor: false
				}),
				Muted
			],
			content: value, // re-seeds after a {#key locale} recreation
			editorProps: {
				attributes: {
					class: 'rich-text min-h-21 px-3.5 py-3 outline-none',
					role: 'textbox',
					'aria-multiline': 'true',
					// A wrapping <label> doesn't associate with contenteditable.
					'aria-label': label ?? ''
				}
			},
			onTransaction: () => {
				tick++;
			},
			onUpdate: ({ editor }) => {
				value = editor.getHTML();
			}
		});
		editor = e;
		return () => e.destroy();
	});

	const controls: {
		label: () => string;
		icon: typeof Bold;
		active: string;
		cmd: (e: Editor) => void;
	}[] = [
		{
			label: m.rteBold,
			icon: Bold,
			active: 'bold',
			cmd: (e) => e.chain().focus().toggleBold().run()
		},
		{
			label: m.rteItalic,
			icon: Italic,
			active: 'italic',
			cmd: (e) => e.chain().focus().toggleItalic().run()
		},
		{
			label: m.rteBulletList,
			icon: List,
			active: 'bulletList',
			cmd: (e) => e.chain().focus().toggleBulletList().run()
		},
		{
			label: m.rteOrderedList,
			icon: ListOrdered,
			active: 'orderedList',
			cmd: (e) => e.chain().focus().toggleOrderedList().run()
		},
		{
			label: m.rteMuted,
			icon: Baseline,
			active: 'muted',
			cmd: (e) => e.chain().focus().toggleMark('muted').run()
		}
	];
</script>

<div class="flex flex-col gap-2">
	{#if label}
		<span class="text-2xs font-bold uppercase tracking-widest text-ink-muted">{label}</span>
	{/if}
	<div
		class="w-full rounded-control border-2 border-border-strong bg-card-alt text-body leading-normal text-ink focus-within:border-ink"
	>
		<div role="toolbar" aria-label={label} class="flex gap-1 border-b border-border px-2 py-1.5">
			{#each controls as c (c.active)}
				<button
					type="button"
					aria-label={c.label()}
					aria-pressed={tick >= 0 && !!editor?.isActive(c.active)}
					onmousedown={(ev) => ev.preventDefault()}
					onclick={() => editor && c.cmd(editor)}
					class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-control text-ink-muted transition-colors duration-150 hover:bg-card-alt aria-pressed:bg-hl-tint aria-pressed:text-ink"
				>
					<c.icon size={14} />
				</button>
			{/each}
		</div>
		<div bind:this={element}></div>
	</div>
	{#if name}<input type="hidden" {name} {value} />{/if}
</div>
