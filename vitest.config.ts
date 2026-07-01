import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
	// $lib is a SvelteKit alias; mirror it so unit tests can import lib modules
	// (date.ts now pulls in the generated Paraglide messages via $lib).
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url))
		}
	},
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts', 'tests/**/*.test.ts']
	}
});
