-- Ported 1:1 from src/lib/data/d1.ts. Every app SQL statement lives here, the
-- single home for query-building (mirroring the original's discipline).

-- name: InsertEvent :exec
INSERT INTO events (id, title, description, locale, poll_mode, organizer_token, share_token, status, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', $8);

-- name: InsertDateOption :exec
INSERT INTO date_options (id, event_id, starts_at, ends_at, sort_order)
VALUES ($1, $2, $3, $4, $5);

-- name: InsertInvitee :exec
INSERT INTO invitees (id, event_id, label, token, note, created_at)
VALUES ($1, $2, $3, $4, $5, $6);

-- name: EventByOrganizerToken :one
SELECT * FROM events WHERE organizer_token = $1;

-- name: EventByShareToken :one
SELECT * FROM events WHERE share_token = $1;

-- name: EventByID :one
SELECT * FROM events WHERE id = $1;

-- name: InviteeByToken :one
SELECT * FROM invitees WHERE token = $1;

-- name: DateOptionsForEvent :many
SELECT * FROM date_options WHERE event_id = $1 ORDER BY sort_order;

-- name: InviteesForEvent :many
SELECT * FROM invitees WHERE event_id = $1 ORDER BY created_at;

-- name: ResponsesForInvitee :many
SELECT * FROM responses WHERE invitee_id = $1;

-- name: UpsertResponse :exec
INSERT INTO responses (invitee_id, date_option_id, preference, updated_at)
VALUES ($1, $2, $3, $4)
ON CONFLICT (invitee_id, date_option_id)
DO UPDATE SET preference = excluded.preference, updated_at = excluded.updated_at;

-- name: SetPollMode :exec
UPDATE events SET poll_mode = $2 WHERE id = $1;

-- name: SaveNote :exec
UPDATE invitees SET note = $2 WHERE id = $1;

-- name: CountInvitees :one
SELECT COUNT(*) AS n FROM invitees WHERE event_id = $1;

-- name: Results :many
SELECT d.id AS id,
	SUM(CASE WHEN r.preference = 'preferred'   THEN 1 ELSE 0 END)::bigint AS preferred,
	SUM(CASE WHEN r.preference = 'available'   THEN 1 ELSE 0 END)::bigint AS available,
	SUM(CASE WHEN r.preference = 'unavailable' THEN 1 ELSE 0 END)::bigint AS unavailable
FROM date_options d
LEFT JOIN responses r ON r.date_option_id = d.id
WHERE d.event_id = $1
GROUP BY d.id
ORDER BY d.sort_order;

-- name: AnsweredInviteeIDs :many
SELECT DISTINCT r.invitee_id AS id
FROM responses r JOIN invitees i ON i.id = r.invitee_id
WHERE i.event_id = $1;

-- name: EventResponses :many
SELECT r.* FROM responses r JOIN invitees i ON i.id = r.invitee_id
WHERE i.event_id = $1;

-- name: MaxSortOrder :one
SELECT MAX(sort_order) AS m FROM date_options WHERE event_id = $1;

-- name: InsertDateOptionAppend :exec
INSERT INTO date_options (id, event_id, starts_at, ends_at, sort_order)
VALUES ($1, $2, $3, $4, $5);

-- name: UpdateDateOption :exec
UPDATE date_options SET starts_at = $2, ends_at = $3 WHERE id = $1;

-- name: DeleteResponsesForOption :exec
DELETE FROM responses WHERE date_option_id = $1;

-- name: DeleteDateOption :exec
DELETE FROM date_options WHERE id = $1;

-- name: RenameInvitee :exec
UPDATE invitees SET label = $2 WHERE id = $1;

-- name: DeleteResponsesForInvitee :exec
DELETE FROM responses WHERE invitee_id = $1;

-- name: DeleteInvitee :exec
DELETE FROM invitees WHERE id = $1;

-- name: SetEventStatus :exec
UPDATE events SET status = $2 WHERE id = $1;

-- name: SetEventLocale :exec
UPDATE events SET locale = $2 WHERE id = $1;

-- name: UpdateEventDetails :exec
UPDATE events SET title = $2, description = $3 WHERE id = $1;
