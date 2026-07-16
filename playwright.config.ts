import { defineConfig } from '@playwright/test';

// E2E runs against the real Go server (templ + HTMX) on a local Postgres, so the
// create flow actually writes rows. `make e2e-server` brings up the database
// (compose.yaml), applies the schema, then boots the server. That all hangs off
// the webServer command because Playwright waits for webServer to be ready
// before it would run any globalSetup, so a database started there would be too
// late for the server that needs it.
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
