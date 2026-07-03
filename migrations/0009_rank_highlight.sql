-- Rank and highlight poll types. Additive only:
-- events.highlight_budget = the highlight type's marker-stroke budget (1-10,
-- validated at the form boundary, immutable after creation).
-- responses.value = rank position 1..N or highlight stroke count 0..budget;
-- NULL for the preference-based types.
ALTER TABLE events ADD COLUMN highlight_budget INTEGER NOT NULL DEFAULT 5;
ALTER TABLE responses ADD COLUMN value INTEGER;
