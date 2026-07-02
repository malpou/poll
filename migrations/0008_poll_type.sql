-- Poll type (openspec/specs/question-options). One of dates|question,
-- validated at the form boundary (ALTER TABLE can't add a CHECK); existing
-- polls come out dates. Immutable after creation.
ALTER TABLE events ADD COLUMN poll_type TEXT NOT NULL DEFAULT 'dates';
