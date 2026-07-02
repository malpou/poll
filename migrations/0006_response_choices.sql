-- Per-event response choices (specs/event-management): Available/Unavailable
-- are always offered; "Preferred" and "I don't know" (unsure) are per-event
-- toggles. Defaults preserve current behavior for existing events.
ALTER TABLE events ADD COLUMN allow_preferred INTEGER NOT NULL DEFAULT 1
	CHECK (allow_preferred IN (0, 1));
ALTER TABLE events ADD COLUMN allow_unsure INTEGER NOT NULL DEFAULT 0
	CHECK (allow_unsure IN (0, 1));

-- preference gains 'unsure'. SQLite can't edit an inline CHECK, so responses
-- is rebuilt with the staged scratch-copy pattern from 0004: with deferred
-- FKs, DROP TABLE counts one outstanding violation per parent-referencing row
-- and only row operations decrement that counter, so rows are staged and
-- re-inserted AFTER the rename.
PRAGMA defer_foreign_keys = true;

CREATE TABLE responses_copy (
	invitee_id     TEXT,
	date_option_id TEXT,
	preference     TEXT,
	updated_at     TEXT
);

INSERT INTO responses_copy
	SELECT invitee_id, date_option_id, preference, updated_at FROM responses;

CREATE TABLE responses_new (
	invitee_id     TEXT NOT NULL REFERENCES invitees(id),
	date_option_id TEXT NOT NULL REFERENCES date_options(id),
	preference     TEXT NOT NULL CHECK (preference IN ('preferred', 'available', 'unavailable', 'unsure')),
	updated_at     TEXT NOT NULL,
	PRIMARY KEY (invitee_id, date_option_id)
);

DROP TABLE responses;
ALTER TABLE responses_new RENAME TO responses;

INSERT INTO responses (invitee_id, date_option_id, preference, updated_at)
	SELECT invitee_id, date_option_id, preference, updated_at FROM responses_copy;

DROP TABLE responses_copy;

CREATE INDEX idx_responses_date_option ON responses(date_option_id);
