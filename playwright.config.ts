import { defineConfig } from '@playwright/test';

// E2E runs against the real Go server (templ + HTMX) on a local Postgres, so the
// create flow actually writes rows. `make e2e-server` brings up the database
// (scripts/pg.sh), applies the schema, then boots the server - it all lives in
// the webServer command because Playwright waits for webServer to be ready
// before it would run any globalSetup.
export default defineConfig({
	testDir: 'e2e',
	retries: process.env.CI ? 2 : 1,
	use: { baseURL: 'http://localhost:8787' },
	webServer: {
		command: 'make e2e-server',
		port: 8787,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
