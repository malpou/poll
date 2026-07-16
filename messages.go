// Package poll exists at the module root purely to embed messages/{da,en,fr}.json.
// The embed directive can't reach above its own directory, and the JSON has to
// live at the repo root because the e2e specs read it from there too.
package poll

import "embed"

//go:embed messages/*.json
var Messages embed.FS
