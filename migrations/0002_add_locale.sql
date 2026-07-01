-- Multilingual polls: each event stores its display locale (same for all
-- consumers, resolved in hooks.server.ts). DEFAULT 'da' back-fills every
-- existing poll, since Danish is all we've had.
ALTER TABLE events ADD COLUMN locale TEXT NOT NULL DEFAULT 'da'
	CHECK (locale IN ('da', 'en', 'fr'));
