// Store is the Go port of src/lib/data/d1.ts - the single home for app data
// access. Every method mirrors one DataProvider method from the original, so the
// handlers read the same way the SvelteKit load/actions did.
package db

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/malpou/poll/internal/db/sqlc"
	"github.com/malpou/poll/internal/domain"
	"github.com/malpou/poll/internal/i18n"
)

type Store struct {
	pool *pgxpool.Pool
	q    *sqlc.Queries
}

func New(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool, q: sqlc.New(pool)}
}

func text(s string) pgtype.Text {
	return pgtype.Text{String: s, Valid: true}
}

// nullable maps "" to SQL NULL, mirroring the original's `x || null`.
func nullable(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{}
	}
	return text(s)
}

func nowISO() string { return time.Now().UTC().Format("2006-01-02T15:04:05.000Z") }

// --- Domain row types (mirror src/lib/types.ts) ---

type Event struct {
	ID             string
	Title          string
	Description    string
	Locale         i18n.Locale
	PollMode       string // assigned | open
	OrganizerToken string
	ShareToken     string
	Status         string // open | closed
	CreatedAt      string
}

type DateOption struct {
	ID        string
	EventID   string
	StartsAt  string
	EndsAt    string
	SortOrder int32
}

type Invitee struct {
	ID        string
	EventID   string
	Label     string
	Token     string
	Note      string
	CreatedAt string
}

type Response struct {
	InviteeID    string
	DateOptionID string
	Preference   string
	UpdatedAt    string
}

func mapEvent(e sqlc.Event) Event {
	return Event{
		ID: e.ID, Title: e.Title, Description: e.Description.String,
		Locale: i18n.Locale(e.Locale), PollMode: e.PollMode,
		OrganizerToken: e.OrganizerToken, ShareToken: e.ShareToken.String,
		Status: e.Status, CreatedAt: e.CreatedAt,
	}
}

func mapDateOption(d sqlc.DateOption) DateOption {
	return DateOption{ID: d.ID, EventID: d.EventID, StartsAt: d.StartsAt.String, EndsAt: d.EndsAt.String, SortOrder: d.SortOrder}
}

func mapInvitee(i sqlc.Invitee) Invitee {
	return Invitee{ID: i.ID, EventID: i.EventID, Label: i.Label, Token: i.Token, Note: i.Note.String, CreatedAt: i.CreatedAt}
}

func mapResponse(r sqlc.Response) Response {
	return Response{InviteeID: r.InviteeID, DateOptionID: r.DateOptionID, Preference: r.Preference, UpdatedAt: r.UpdatedAt}
}

func notFound(err error) bool { return errors.Is(err, pgx.ErrNoRows) }

// --- Inputs ---

// DateInput is a date + optional times as the forms hold them before compose.
type DateInput struct {
	Value     string // yyyy-mm-dd
	StartTime string // hh:mm or ''
	EndTime   string // hh:mm or ''
}

func (d DateInput) instants() (starts, ends pgtype.Text) {
	if s, ok := domain.ZonedToUTC(d.Value, d.StartTime); ok {
		starts = text(s)
	}
	if e, ok := domain.ZonedToUTC(d.Value, d.EndTime); ok && d.EndTime != "" {
		ends = text(e)
	}
	return
}

type ResponseInput struct {
	DateOptionID string
	Preference   string
}

type Draft struct {
	Title        string
	Description  string
	Locale       i18n.Locale
	PollMode     string
	Dates        []DateInput
	Participants []struct{ Name, Token string }
}

// --- Reads ---

type EventWithDetails struct {
	Event
	DateOptions []DateOption
	Invitees    []Invitee
}

func (s *Store) EventByOrganizerToken(ctx context.Context, token string) (*EventWithDetails, error) {
	e, err := s.q.EventByOrganizerToken(ctx, token)
	if err != nil {
		if notFound(err) {
			return nil, nil
		}
		return nil, err
	}
	dates, err := s.q.DateOptionsForEvent(ctx, e.ID)
	if err != nil {
		return nil, err
	}
	invitees, err := s.q.InviteesForEvent(ctx, e.ID)
	if err != nil {
		return nil, err
	}
	out := &EventWithDetails{Event: mapEvent(e)}
	for _, d := range dates {
		out.DateOptions = append(out.DateOptions, mapDateOption(d))
	}
	for _, i := range invitees {
		out.Invitees = append(out.Invitees, mapInvitee(i))
	}
	return out, nil
}

type InviteeContext struct {
	Invitee     Invitee
	Event       Event
	DateOptions []DateOption
	Responses   []Response
}

func (s *Store) InviteeContext(ctx context.Context, token string) (*InviteeContext, error) {
	inv, err := s.q.InviteeByToken(ctx, token)
	if err != nil {
		if notFound(err) {
			return nil, nil
		}
		return nil, err
	}
	ev, err := s.q.EventByID(ctx, inv.EventID)
	if err != nil {
		if notFound(err) {
			return nil, nil
		}
		return nil, err
	}
	dates, err := s.q.DateOptionsForEvent(ctx, inv.EventID)
	if err != nil {
		return nil, err
	}
	resp, err := s.q.ResponsesForInvitee(ctx, inv.ID)
	if err != nil {
		return nil, err
	}
	out := &InviteeContext{Invitee: mapInvitee(inv), Event: mapEvent(ev)}
	for _, d := range dates {
		out.DateOptions = append(out.DateOptions, mapDateOption(d))
	}
	for _, r := range resp {
		out.Responses = append(out.Responses, mapResponse(r))
	}
	return out, nil
}

type ShareContext struct {
	Event       Event
	DateOptions []DateOption
}

// ShareContext resolves an open-mode shared link. Nil if unknown OR the poll is
// not in open mode - a non-open share token must read as "link not found".
func (s *Store) ShareContext(ctx context.Context, shareToken string) (*ShareContext, error) {
	e, err := s.q.EventByShareToken(ctx, text(shareToken))
	if err != nil {
		if notFound(err) {
			return nil, nil
		}
		return nil, err
	}
	ev := mapEvent(e)
	if ev.PollMode != "open" {
		return nil, nil
	}
	dates, err := s.q.DateOptionsForEvent(ctx, ev.ID)
	if err != nil {
		return nil, err
	}
	out := &ShareContext{Event: ev}
	for _, d := range dates {
		out.DateOptions = append(out.DateOptions, mapDateOption(d))
	}
	return out, nil
}

// --- Writes ---

func (s *Store) CreateEvent(ctx context.Context, d Draft) (organizerToken string, err error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx) //nolint:errcheck // no-op after Commit
	q := s.q.WithTx(tx)

	now := nowISO()
	eventID := domain.ID("event")
	organizerToken = domain.NewToken()
	shareToken := domain.NewToken()

	if err = q.InsertEvent(ctx, sqlc.InsertEventParams{
		ID: eventID, Title: d.Title, Description: nullable(d.Description),
		Locale: string(d.Locale), PollMode: d.PollMode,
		OrganizerToken: organizerToken, ShareToken: text(shareToken), CreatedAt: now,
	}); err != nil {
		return "", err
	}

	for i, dt := range d.Dates {
		starts, ends := dt.instants()
		if err = q.InsertDateOption(ctx, sqlc.InsertDateOptionParams{
			ID: domain.ID("date"), EventID: eventID, StartsAt: starts, EndsAt: ends, SortOrder: int32(i),
		}); err != nil {
			return "", err
		}
	}

	for _, p := range d.Participants {
		if err = q.InsertInvitee(ctx, sqlc.InsertInviteeParams{
			ID: domain.ID("p"), EventID: eventID, Label: p.Name, Token: p.Token, CreatedAt: now,
		}); err != nil {
			return "", err
		}
	}

	if err = tx.Commit(ctx); err != nil {
		return "", err
	}
	return organizerToken, nil
}

// SubmitOpenResponse creates the invitee (label = typed name) and saves its
// answers + note in one go. Returns the new invitee token (the edit link).
func (s *Store) SubmitOpenResponse(ctx context.Context, eventID, name string, answers []ResponseInput, note string) (string, error) {
	token := domain.NewToken()
	inviteeID := domain.ID("p")
	if err := s.q.InsertInvitee(ctx, sqlc.InsertInviteeParams{
		ID: inviteeID, EventID: eventID, Label: name, Token: token,
		Note: nullable(note), CreatedAt: nowISO(),
	}); err != nil {
		return "", err
	}
	if err := s.SaveResponses(ctx, inviteeID, answers); err != nil {
		return "", err
	}
	return token, nil
}

func (s *Store) SaveResponses(ctx context.Context, inviteeID string, answers []ResponseInput) error {
	if len(answers) == 0 {
		return nil
	}
	now := nowISO()
	for _, a := range answers {
		if err := s.q.UpsertResponse(ctx, sqlc.UpsertResponseParams{
			InviteeID: inviteeID, DateOptionID: a.DateOptionID,
			Preference: a.Preference, UpdatedAt: now,
		}); err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) SaveNote(ctx context.Context, inviteeID, note string) error {
	return s.q.SaveNote(ctx, sqlc.SaveNoteParams{ID: inviteeID, Note: nullable(note)})
}

func (s *Store) SetPollMode(ctx context.Context, eventID, mode string) error {
	return s.q.SetPollMode(ctx, sqlc.SetPollModeParams{ID: eventID, PollMode: mode})
}

func (s *Store) SetEventStatus(ctx context.Context, eventID, status string) error {
	return s.q.SetEventStatus(ctx, sqlc.SetEventStatusParams{ID: eventID, Status: status})
}

func (s *Store) SetEventLocale(ctx context.Context, eventID string, l i18n.Locale) error {
	return s.q.SetEventLocale(ctx, sqlc.SetEventLocaleParams{ID: eventID, Locale: string(l)})
}

func (s *Store) UpdateEventDetails(ctx context.Context, eventID, title, description string) error {
	return s.q.UpdateEventDetails(ctx, sqlc.UpdateEventDetailsParams{
		ID: eventID, Title: title, Description: nullable(description),
	})
}

// AddDateOption appends after the current last option for this event.
func (s *Store) AddDateOption(ctx context.Context, eventID string, d DateInput) error {
	max, err := s.q.MaxSortOrder(ctx, eventID)
	if err != nil {
		return err
	}
	next := int32(0)
	if v, ok := max.(int32); ok {
		next = v + 1
	}
	starts, ends := d.instants()
	return s.q.InsertDateOptionAppend(ctx, sqlc.InsertDateOptionAppendParams{
		ID: domain.ID("date"), EventID: eventID, StartsAt: starts, EndsAt: ends, SortOrder: next,
	})
}

func (s *Store) UpdateDateOption(ctx context.Context, optionID string, d DateInput) error {
	starts, ends := d.instants()
	return s.q.UpdateDateOption(ctx, sqlc.UpdateDateOptionParams{ID: optionID, StartsAt: starts, EndsAt: ends})
}

// RemoveDateOption clears responses first - no FK cascade, same as the original.
func (s *Store) RemoveDateOption(ctx context.Context, optionID string) error {
	if err := s.q.DeleteResponsesForOption(ctx, optionID); err != nil {
		return err
	}
	return s.q.DeleteDateOption(ctx, optionID)
}

func (s *Store) AddInvitee(ctx context.Context, eventID, label string) (string, error) {
	token := domain.NewToken()
	return token, s.q.InsertInvitee(ctx, sqlc.InsertInviteeParams{
		ID: domain.ID("p"), EventID: eventID, Label: label, Token: token, CreatedAt: nowISO(),
	})
}

func (s *Store) RenameInvitee(ctx context.Context, inviteeID, label string) error {
	return s.q.RenameInvitee(ctx, sqlc.RenameInviteeParams{ID: inviteeID, Label: label})
}

func (s *Store) RemoveInvitee(ctx context.Context, inviteeID string) error {
	if err := s.q.DeleteResponsesForInvitee(ctx, inviteeID); err != nil {
		return err
	}
	return s.q.DeleteInvitee(ctx, inviteeID)
}

// --- Results ---

type OptionResult struct {
	DateOptionID string
	domain.Counts
	NotAnswered int
}

// Results mirrors getResults(): counts per option, with notAnswered derived from
// the invitee total so a missing responses row reads as "no answer", never as
// "unavailable".
func (s *Store) Results(ctx context.Context, eventID string) ([]OptionResult, error) {
	total, err := s.q.CountInvitees(ctx, eventID)
	if err != nil {
		return nil, err
	}
	rows, err := s.q.Results(ctx, eventID)
	if err != nil {
		return nil, err
	}
	out := make([]OptionResult, 0, len(rows))
	for _, r := range rows {
		c := domain.Counts{Preferred: int(r.Preferred), Available: int(r.Available), Unavailable: int(r.Unavailable)}
		out = append(out, OptionResult{
			DateOptionID: r.ID,
			Counts:       c,
			NotAnswered:  int(total) - c.Preferred - c.Available - c.Unavailable,
		})
	}
	return out, nil
}

func (s *Store) AnsweredInviteeIDs(ctx context.Context, eventID string) (map[string]bool, error) {
	ids, err := s.q.AnsweredInviteeIDs(ctx, eventID)
	if err != nil {
		return nil, err
	}
	set := make(map[string]bool, len(ids))
	for _, id := range ids {
		set[id] = true
	}
	return set, nil
}

func (s *Store) EventResponses(ctx context.Context, eventID string) ([]Response, error) {
	rows, err := s.q.EventResponses(ctx, eventID)
	if err != nil {
		return nil, err
	}
	out := make([]Response, 0, len(rows))
	for _, r := range rows {
		out = append(out, mapResponse(r))
	}
	return out, nil
}
