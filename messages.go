// Package poll exists at the module root purely to embed messages/{da,en,fr}.json.
// The embed directive can't reach above its own directory, and these JSON files
// must stay at the repo root because the Playwright specs import them through
// Paraglide - one source of truth for copy, rendered by Go, asserted by the tests.
package poll

import "embed"

//go:embed messages/*.json
var Messages embed.FS
