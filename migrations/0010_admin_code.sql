-- Second admin secret for polls created with an organizer email. NULL = ungated
-- (every existing poll, every no-email poll), so behavior is untouched by default.
ALTER TABLE events ADD COLUMN admin_code TEXT;
