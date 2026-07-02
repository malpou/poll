-- Per-event timezone (specs/event-management) + Spanish/German locales, base
-- locale flipped to English. SQLite can't edit an inline CHECK, so events is
-- rebuilt - same staged-copy pattern (and rationale) as 0004: rows are staged
-- in a scratch table and inserted AFTER the rename so deferred-FK counters
-- settle before COMMIT.
PRAGMA defer_foreign_keys = true;

CREATE TABLE events_copy (
	id              TEXT,
	title           TEXT,
	description     TEXT,
	organizer_token TEXT,
	status          TEXT,
	created_at      TEXT,
	locale          TEXT,
	poll_mode       TEXT,
	share_token     TEXT
);

INSERT INTO events_copy
	SELECT id, title, description, organizer_token, status, created_at, locale, poll_mode, share_token
	FROM events;

CREATE TABLE events_new (
	id              TEXT PRIMARY KEY,
	title           TEXT NOT NULL,
	description     TEXT,
	organizer_token TEXT NOT NULL UNIQUE,
	status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
	created_at      TEXT NOT NULL,
	locale          TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('da', 'de', 'en', 'es', 'fr')),
	poll_mode       TEXT NOT NULL DEFAULT 'assigned' CHECK (poll_mode IN ('assigned', 'open')),
	share_token     TEXT,
	-- IANA id, validated at the app's form boundary (the full zone list doesn't
	-- belong in a CHECK). Existing rows backfill to the old implicit zone.
	timezone        TEXT NOT NULL DEFAULT 'Europe/Copenhagen'
);

DROP TABLE events;
ALTER TABLE events_new RENAME TO events;

INSERT INTO events (id, title, description, organizer_token, status, created_at, locale, poll_mode, share_token)
	SELECT id, title, description, organizer_token, status, created_at, locale, poll_mode, share_token
	FROM events_copy;

DROP TABLE events_copy;

CREATE UNIQUE INDEX idx_events_share_token ON events(share_token);
