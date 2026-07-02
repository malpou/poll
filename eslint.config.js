import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

// Force user-facing text through Paraglide messages: flag any non-whitespace,
// non-punctuation literal text node in .svelte markup. svelte-eslint-parser
// (loaded via svelte.configs.recommended) emits these as SvelteText.
const noHardcodedText = {
	meta: {
		type: 'problem',
		docs: { description: 'Use Paraglide m.*() for user-facing text, not literal markup text' },
		schema: []
	},
	create(ctx) {
		return {
			SvelteText(node) {
				// Raw <script>/<style> bodies are also SvelteText - skip them.
				const parentType = node.parent?.type;
				if (parentType === 'SvelteScriptElement' || parentType === 'SvelteStyleElement') return;
				if (node.value.trim() === '') return; // whitespace only
				if (!/[\p{L}\p{N}]/u.test(node.value)) return; // punctuation/symbols only
				ctx.report({
					node,
					message: `Hardcoded text "${node.value.trim()}" - use a Paraglide message (m.*()).`
				});
			}
		};
	}
};

export default defineConfig(
	{
		ignores: [
			'.svelte-kit/',
			'.wrangler/',
			'build/',
			'node_modules/',
			'bun.lock',
			'src/lib/paraglide/'
		]
	},
	js.configs.recommended,
	ts.configs.strictTypeChecked,
	ts.configs.stylisticTypeChecked,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
			parserOptions: {
				projectService: {
					// These aren't in any tsconfig; lint them out-of-project.
					allowDefaultProject: ['eslint.config.js', 'vitest.config.ts']
				},
				extraFileExtensions: ['.svelte'],
				tsconfigRootDir: import.meta.dirname
			}
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		plugins: { local: { rules: { 'no-hardcoded-text': noHardcodedText } } },
		languageOptions: {
			parserOptions: {
				projectService: true,
				parser: ts.parser
			}
		},
		rules: {
			// `$bindable()` is a Svelte rune, not a useless prop default.
			'@typescript-eslint/no-useless-default-assignment': 'off',
			// {@render localSnippet(x)} is a void call in expression position by
			// design; the rule can't tell it from a mistake.
			'@typescript-eslint/no-confusing-void-expression': 'off',
			// All user-facing copy must go through Paraglide (m.*()).
			'local/no-hardcoded-text': 'error'
		}
	},
	{
		// Test files exercise SQL against a raw driver; loosen the strictest bans.
		files: ['tests/**/*.ts', '**/*.test.ts'],
		rules: {
			'@typescript-eslint/no-non-null-assertion': 'off'
		}
	},
	{
		// Mock provider: intentionally await-free stubs implementing an async interface.
		files: ['src/lib/data/mock.ts'],
		rules: {
			'@typescript-eslint/require-await': 'off'
		}
	},
	{
		// Config files: lint for correctness but skip type-aware rules (loose plugin types).
		files: ['eslint.config.js', 'vitest.config.ts'],
		extends: [ts.configs.disableTypeChecked]
	},
	{
		// Playwright e2e + its config aren't in the SvelteKit tsconfig include, so
		// skip type-aware rules there rather than wiring a separate project.
		files: ['e2e/**/*.ts', 'playwright.config.ts'],
		extends: [ts.configs.disableTypeChecked]
	}
);
