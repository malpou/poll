#!/usr/bin/env bash
# Bring up the local Postgres the app and the e2e specs share, then apply the
# schema. Idempotent: reuses a running container so repeat runs are fast.
#
# Lives outside globalSetup because Playwright waits for webServer to be ready
# *before* running globalSetup - so the database has to come up with the server,
# not after it.
set -euo pipefail

CONTAINER="${PG_CONTAINER:-poll-pg-e2e}"
PORT="${PGPORT:-55432}"
URL="${DATABASE_URL:-postgres://postgres:postgres@localhost:${PORT}/poll}"
SCHEMA="internal/db/migrations/0001_init.sql"

# CI supplies its own Postgres service and applies the schema itself, so there is
# nothing for this script to do there.
if [ -n "${SKIP_DOCKER_PG:-}" ]; then
	echo "SKIP_DOCKER_PG set - using the existing database"
	exit 0
fi

running() {
	[ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null || echo false)" = "true" ]
}

if ! running; then
	docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
	docker run -d --name "$CONTAINER" \
		-e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=poll \
		-p "${PORT}:5432" postgres:16-alpine >/dev/null
fi

# The server accepts TCP before it accepts queries - poll pg_isready.
for _ in $(seq 1 60); do
	if docker exec "$CONTAINER" pg_isready -U postgres -d poll >/dev/null 2>&1; then
		break
	fi
	sleep 1
done

# Fresh schema each run, matching the old "migrate a clean local D1" behaviour.
psql "$URL" -v ON_ERROR_STOP=1 -X -q -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
psql "$URL" -v ON_ERROR_STOP=1 -X -q -f "$SCHEMA"
echo "postgres ready on :${PORT}"
