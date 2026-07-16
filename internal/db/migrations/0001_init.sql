-- Timestamps are TEXT holding UTC ISO instants rather than timestamptz: the app
-- renders them in Europe/Copenhagen itself (internal/domain/date.go) and stores
-- exactly what it formatted, so nothing is reinterpreted on the way back out.
-- starts_at/ends_at nullable; ends_at requires starts_at.

CREATE TABLE events (
	id              TEXT PRIMARY KEY,
	title           TEXT NOT NULL,
	description     TEXT,
	locale          TEXT NOT NULL DEFAULT 'da' CHECK (locale IN ('da', 'en', 'fr')),
	poll_mode       TEXT NOT NULL DEFAULT 'assigned' CHECK (poll_mode IN ('assigned', 'open')),
	organizer_token TEXT NOT NULL UNIQUE,
	share_token     TEXT UNIQUE,
	status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
	created_at      TEXT NOT NULL
);

CREATE TABLE date_options (
	id         TEXT PRIMARY KEY,
	event_id   TEXT NOT NULL REFERENCES events(id),
	starts_at  TEXT,
	ends_at    TEXT,
	label      TEXT,
	sort_order INTEGER NOT NULL DEFAULT 0,
	CHECK (ends_at IS NULL OR starts_at IS NOT NULL)
);

CREATE TABLE invitees (
	id         TEXT PRIMARY KEY,
	event_id   TEXT NOT NULL REFERENCES events(id),
	label      TEXT NOT NULL,
	token      TEXT NOT NULL UNIQUE,
	note       TEXT,
	created_at TEXT NOT NULL
);

CREATE TABLE responses (
	invitee_id     TEXT NOT NULL REFERENCES invitees(id),
	date_option_id TEXT NOT NULL REFERENCES date_options(id),
	preference     TEXT NOT NULL CHECK (preference IN ('preferred', 'available', 'unavailable')),
	updated_at     TEXT NOT NULL,
	PRIMARY KEY (invitee_id, date_option_id)
);

CREATE INDEX idx_date_options_event ON date_options(event_id);
CREATE INDEX idx_invitees_event ON invitees(event_id);
CREATE INDEX idx_responses_date_option ON responses(date_option_id);
