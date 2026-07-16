.PHONY: generate css vendor build run db e2e-server test clean

# Everything generated is committed (see .gitattributes); CI runs `make generate`
# and fails if the tree is dirty afterwards, so these stay honest.
#   templ    -> *_templ.go
#   sqlc     -> internal/db/sqlc/
#   paraglide-> src/lib/paraglide/  (the module the e2e specs import)
#   gen-types-> src/lib/types.ts    (the types the e2e specs import)
generate:
	templ generate
	sqlc generate
	bun run messages
	./scripts/gen-types.sh
	# paraglide-js writes a `*` .gitignore into its own output dir. We commit that
	# output deliberately (the specs import it), so drop the ignore file - it would
	# otherwise hide the module from a fresh clone and from CI's porcelain check.
	rm -f src/lib/paraglide/.gitignore src/lib/paraglide/.prettierignore

css:
	bunx @tailwindcss/cli -i static/app.src.css -o static/app.css --minify

vendor:
	cp node_modules/htmx.org/dist/htmx.min.js static/htmx.min.js
	cp node_modules/alpinejs/dist/cdn.min.js static/alpine.min.js

build: generate css vendor
	go build ./...

# Bring up the local Postgres and apply the schema.
db:
	./scripts/pg.sh

run: build db
	go run ./cmd/server

# What playwright.config.ts boots: database first, then the server.
e2e-server: build db
	go run ./cmd/server

test:
	go test ./...

clean:
	rm -f static/app.css static/htmx.min.js static/alpine.min.js
	find . -name '*_templ.go' -delete
