import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig(
	{
		ignores: ['.svelte-kit/', '.wrangler/', 'build/', 'node_modules/', 'bun.lock']
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
		languageOptions: {
			parserOptions: {
				projectService: true,
				parser: ts.parser
			}
		},
		rules: {
			// `$bindable()` is a Svelte rune, not a useless prop default.
			'@typescript-eslint/no-useless-default-assignment': 'off'
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
