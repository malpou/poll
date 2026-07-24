-- Planning poker (openspec/specs/planning-poker): a real-time, controller-run
-- estimation room. These tables hold the DURABLE skeleton only - the room, its
-- ordered items, and each item's final estimate. The live phase (waiting /
-- voting / revealed) and in-flight per-participant votes are ephemeral
-- coordination state and are NOT stored here; they live in the real-time layer
-- and only a decided estimate is ever written back (poker_rounds.final_estimate).
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
