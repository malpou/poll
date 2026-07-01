import { defineConfig } from '@playwright/test';

// E2E runs against the real Worker + local D1 (`bun run preview` = vite build &&
// wrangler dev on :8787), so the create flow actually writes rows. `vite dev`
// would fall back to the mock provider and never persist. globalSetup applies
// migrations to the local D1 before the server boots.
export default defineConfig({
	testDir: 'e2e',
	globalSetup: './e2e/global-setup.ts',
	use: { baseURL: 'http://localhost:8787' },
	webServer: {
		command: 'bun run preview',
		port: 8787,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
