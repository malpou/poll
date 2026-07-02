-- Closing now records a decision (specs/poll-closing). status gains 'cancelled'
-- for the explicit no-decision close. SQLite can't edit an inline CHECK, so
-- events is rebuilt.
--
-- Rebuild order matters: with deferred FKs, DROP TABLE counts one outstanding
-- violation per child-referenced row, and only row operations decrement that
-- counter - recreating the table via RENAME does not. So the rows are staged
-- in a scratch table and inserted AFTER the rename; those inserts satisfy the
-- counter and the COMMIT passes. (Copying into events_new before the drop
-- fails at COMMIT on any database that has events with children.)
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
	locale          TEXT NOT NULL DEFAULT 'da' CHECK (locale IN ('da', 'en', 'fr')),
	poll_mode       TEXT NOT NULL DEFAULT 'assigned' CHECK (poll_mode IN ('assigned', 'open')),
	share_token     TEXT
);

DROP TABLE events;
ALTER TABLE events_new RENAME TO events;

INSERT INTO events (id, title, description, organizer_token, status, created_at, locale, poll_mode, share_token)
	SELECT id, title, description, organizer_token, status, created_at, locale, poll_mode, share_token
	FROM events_copy;

DROP TABLE events_copy;

CREATE UNIQUE INDEX idx_events_share_token ON events(share_token);

-- The organizer's final pick: one or more options flagged while the poll is
-- closed. Reopening clears every flag. Polls closed before this migration keep
-- status='closed' with zero selected rows - rendered as a plain closed poll.
ALTER TABLE date_options ADD COLUMN selected INTEGER NOT NULL DEFAULT 0
	CHECK (selected IN (0, 1));
