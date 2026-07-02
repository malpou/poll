-- Per-poll highlighter accent (openspec/specs/event-management). One of
-- yellow|pink|green|blue, validated at the form boundary (ALTER TABLE can't
-- add a CHECK); existing polls come out yellow.
ALTER TABLE events ADD COLUMN accent TEXT NOT NULL DEFAULT 'yellow';
