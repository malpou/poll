import { defineConfig } from '@playwright/test';

// E2E runs against the real Worker + local D1 (`bun run preview` = vite build &&
// wrangler dev on :8787), so the create flow actually writes rows. `vite dev`
// would fall back to the mock provider and never persist. globalSetup applies
// migrations to the local D1 before the server boots.
export default defineConfig({
	testDir: 'e2e',
	globalSetup: './e2e/global-setup.ts',
	// The preview server and every worker share one local-D1 SQLite file, and
	// miniflare's D1 connection takes no busy_timeout, so parallel app writes
	// collide (SQLITE_BUSY). Seeding is in-process now (e2e/db.ts), so the whole
	// suite runs in well under a minute single-worker - cheaper than fighting the
	// lock. One retry still absorbs any genuine transient.
	workers: 1,
	retries: 1,
	use: { baseURL: 'http://localhost:8787' },
	webServer: {
		command: 'bun run preview',
		port: 8787,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
