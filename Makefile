DATABASE_URL ?= postgres://postgres:postgres@localhost:55432/poll

.PHONY: generate css vendor build run db e2e-server test clean

# Everything generated is committed (see .gitattributes); CI runs `make build`
# and fails if the tree is dirty afterwards, so these stay honest.
#   templ    -> *_templ.go
#   sqlc     -> internal/db/{db,models,queries.sql}.go
#   paraglide-> src/lib/paraglide/  (the module the e2e specs import)
generate:
	templ generate
	sqlc generate
	bun run messages
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

# Bring up Postgres (idempotent - reuses a running container) and apply the
# schema fresh, so no run inherits the last one's rows. CI supplies its own
# database and applies the schema itself, so it skips this.
db:
	docker compose up -d --wait
	psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -X -q \
		-c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;' \
		-f internal/db/migrations/0001_init.sql

run: build db
	go run ./cmd/server

# What playwright.config.ts boots. CI already has a database with the schema
# applied, so it sets DB_READY=1 and this skips straight to the server.
e2e-server: build $(if $(DB_READY),,db)
	go run ./cmd/server

test:
	go test ./...

clean:
	rm -f static/app.css static/htmx.min.js static/alpine.min.js
	find . -name '*_templ.go' -delete
	# sqlc's output shares internal/db/ with the hand-written store.go, so remove
	# it by exact name - never a wildcard over that directory.
	rm -f internal/db/db.go internal/db/models.go internal/db/queries.sql.go
	docker compose down -v 2>/dev/null || true
