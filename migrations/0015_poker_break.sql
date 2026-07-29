-- A coffee break can be called at any time, not only by playing the ☕ card in
-- a voting round (openspec/specs/planning-poker "Call a coffee break").
--
-- One nullable column carries the whole feature: NULL = no break, otherwise the
-- display name of whoever called it (empty string when the caller has no seat).
-- Advisory only - it blocks no phase, so no phase/status column changes.
ALTER TABLE poker_rooms ADD COLUMN break_called_by TEXT;
