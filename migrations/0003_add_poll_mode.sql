-- Two poll modes. 'assigned' (the only mode so far): organizer defines a fixed
-- list of invitees, one per-person link each. 'open': one shared link (/s/{token})
-- anyone can use to submit their own name + preferences. share_token is minted for
-- every event so a poll can switch to open later without touching rows.
--
-- SQLite can't add UNIQUE inline via ALTER, so share_token gets a separate unique
-- index. Existing rows are back-filled with a random hex token (app mints base62
-- going forward; hex is a fine one-off for the handful of existing polls).
ALTER TABLE events ADD COLUMN poll_mode TEXT NOT NULL DEFAULT 'assigned'
	CHECK (poll_mode IN ('assigned', 'open'));
ALTER TABLE events ADD COLUMN share_token TEXT;

UPDATE events SET share_token = lower(hex(randomblob(16))) WHERE share_token IS NULL;

CREATE UNIQUE INDEX idx_events_share_token ON events(share_token);
