-- Planning poker (openspec/specs/planning-poker): a real-time, controller-run
-- estimation room. Real-time is D1-backed (no Durable Object): clients short-
-- poll a state endpoint, so the live session lives in these tables too.
--
-- Durable skeleton: poker_rooms + poker_rounds (the room, its ordered items,
-- each item's final estimate - the only durable artifact of a decided item).
-- Live/transient state: the room's phase + active round + rev counter,
-- poker_participants (heartbeat-presence roster), and poker_votes (the active
-- item's votes, cleared on finalize/re-vote).
--
-- Additive: no existing table is touched, nothing to backfill.
-- Two unguessable capability tokens per room mirror organizer/share tokens:
-- controller_token (private, facilitates) and join_token (shared, participants).

CREATE TABLE poker_rooms (
	id               TEXT PRIMARY KEY,
	title            TEXT NOT NULL,
	-- Reserved for future decks; only the modified-Fibonacci deck ships today.
	deck             TEXT NOT NULL DEFAULT 'fibonacci',
	controller_token TEXT NOT NULL UNIQUE,
	join_token       TEXT NOT NULL UNIQUE,
	status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
	-- Live phase of the current item. waiting = between items.
	phase            TEXT NOT NULL DEFAULT 'waiting' CHECK (phase IN ('waiting', 'voting', 'revealed')),
	-- The item being voted/revealed; NULL while waiting.
	active_round_id  TEXT REFERENCES poker_rounds(id),
	-- Bumped on every mutation so a state poll can cheaply detect change.
	rev              INTEGER NOT NULL DEFAULT 0,
	created_at       TEXT NOT NULL
);

CREATE TABLE poker_rounds (
	id             TEXT PRIMARY KEY,
	room_id        TEXT NOT NULL REFERENCES poker_rooms(id),
	-- The story/ticket label or id the controller typed for this item.
	title          TEXT NOT NULL,
	sort_order     INTEGER NOT NULL DEFAULT 0,
	-- The recorded deck value (or a split/skip marker); NULL until the controller
	-- decides the item.
	final_estimate TEXT,
	decided_at     TEXT
);

CREATE INDEX idx_poker_rounds_room ON poker_rounds(room_id, sort_order);

-- One seat per named participant. Presence is derived from last_seen_at (a seat
-- is "present" within a short window, refreshed by each state poll). id is the
-- cookie-carried per-browser id so a refresh resumes the same seat.
CREATE TABLE poker_participants (
	id            TEXT PRIMARY KEY,
	room_id       TEXT NOT NULL REFERENCES poker_rooms(id),
	name          TEXT NOT NULL,
	role          TEXT NOT NULL DEFAULT 'estimator' CHECK (role IN ('estimator', 'observer')),
	-- 1 on the controller's own seat (the facilitator); 0 for everyone else.
	is_controller INTEGER NOT NULL DEFAULT 0,
	last_seen_at  TEXT NOT NULL
);

CREATE INDEX idx_poker_participants_room ON poker_participants(room_id);

-- The active item's votes. card is text: a deck numeral ('0'..'100') or a
-- special ('?', 'infinity', 'coffee'). Transient - deleted on finalize/re-vote.
CREATE TABLE poker_votes (
	round_id       TEXT NOT NULL REFERENCES poker_rounds(id),
	participant_id TEXT NOT NULL REFERENCES poker_participants(id),
	card           TEXT NOT NULL,
	updated_at     TEXT NOT NULL,
	PRIMARY KEY (round_id, participant_id)
);
