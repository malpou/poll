import { defineConfig } from '@playwright/test';

// E2E runs against the real Worker + local D1 (`bun run preview` = vite build &&
// wrangler dev on :8787), so the create flow actually writes rows. `vite dev`
// would fall back to the mock provider and never persist. globalSetup applies
// migrations to the local D1 before the server boots.
export default defineConfig({
	testDir: 'e2e',
	globalSetup: './e2e/global-setup.ts',
	// The preview server and the seed helper hit one shared local-D1 file, so a
	// read can occasionally lag a just-written row (a whole-test race the in-helper
	// retry can't catch). Retry once in CI rather than chase every read with a poll.
	retries: process.env.CI ? 2 : 1,
	use: { baseURL: 'http://localhost:8787' },
	webServer: {
		command: 'bun run preview',
		port: 8787,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
