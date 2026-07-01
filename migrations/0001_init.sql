-- Iteration 2 schema. Mirrors specs/PROJECT.md data model.
-- All timestamps are UTC ISO text (rendered Europe/Copenhagen in the UI).
-- date_options.starts_at/ends_at are nullable; ends_at requires starts_at.

CREATE TABLE events (
	id              TEXT PRIMARY KEY,
	title           TEXT NOT NULL,
	description     TEXT,
	organizer_token TEXT NOT NULL UNIQUE,
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

-- event_id lookups; tokens already indexed via their UNIQUE constraints.
CREATE INDEX idx_date_options_event ON date_options(event_id);
CREATE INDEX idx_invitees_event ON invitees(event_id);
CREATE INDEX idx_responses_date_option ON responses(date_option_id);
