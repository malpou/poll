package handlers

import (
	"net/http"

	"github.com/malpou/poll/internal/db"
	"github.com/malpou/poll/internal/domain"
	"github.com/malpou/poll/internal/i18n"
	"github.com/malpou/poll/internal/views"
)

// dateInput reads a date + optional times from a form into the store's shape.
func dateInput(r *http.Request) db.DateInput {
	return db.DateInput{
		Value:     field(r, "value"),
		StartTime: field(r, "startTime"),
		EndTime:   field(r, "endTime"),
	}
}

// GET /e/{token}
func (a *App) dashboardPage(w http.ResponseWriter, r *http.Request) {
	token := r.PathValue("token")
	ev, err := a.store.EventByOrganizerToken(r.Context(), token)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	// Reveal nothing on an unknown token - same discipline as the response page.
	if ev == nil {
		renderNotFound(w, r)
		return
	}
	v, err := a.dashboardView(r, ev, token)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	render(w, r, views.DashboardPage(v))
}

// dashboardView assembles the whole dashboard payload: results + counts + who
// chose what, the option list, and the invitee list. Mirrors the original load().
func (a *App) dashboardView(r *http.Request, ev *db.EventWithDetails, token string) (views.DashboardView, error) {
	ctx := r.Context()
	results, err := a.store.Results(ctx, ev.ID)
	if err != nil {
		return views.DashboardView{}, err
	}
	answered, err := a.store.AnsweredInviteeIDs(ctx, ev.ID)
	if err != nil {
		return views.DashboardView{}, err
	}
	responses, err := a.store.EventResponses(ctx, ev.ID)
	if err != nil {
		return views.DashboardView{}, err
	}
	l := ev.Locale
	totalInvitees := len(ev.Invitees)

	// Who chose what, per option: group responder names by preference so the
	// organizer can expand a date and see the specific people behind each count.
	nameByID := map[string]string{}
	for _, inv := range ev.Invitees {
		nameByID[inv.ID] = inv.Label
	}
	namesByOption := map[string]map[string][]string{}
	for _, resp := range responses {
		if namesByOption[resp.DateOptionID] == nil {
			namesByOption[resp.DateOptionID] = map[string][]string{}
		}
		namesByOption[resp.DateOptionID][resp.Preference] = append(
			namesByOption[resp.DateOptionID][resp.Preference], nameByID[resp.InviteeID])
	}

	countsByID := map[string]db.OptionResult{}
	for _, res := range results {
		countsByID[res.DateOptionID] = res
	}
	pct := func(n int) int {
		if totalInvitees == 0 {
			return 0
		}
		return int(float64(n)/float64(totalInvitees)*100 + 0.5)
	}

	// Join counts with each option's localised labels, then rank + highlight.
	rows := make([]views.ResultView, 0, len(ev.DateOptions))
	for _, d := range ev.DateOptions {
		c := countsByID[d.ID]
		f := domain.FormatDateOption(d.StartsAt, d.EndsAt, l)
		rows = append(rows, views.ResultView{
			ID:               d.ID,
			Preferred:        c.Preferred,
			Available:        c.Available,
			Unavailable:      c.Unavailable,
			PreferredPct:     pct(c.Preferred),
			AvailablePct:     pct(c.Available),
			UnavailablePct:   pct(c.Unavailable),
			PreferredNames:   namesByOption[d.ID]["preferred"],
			AvailableNames:   namesByOption[d.ID]["available"],
			UnavailableNames: namesByOption[d.ID]["unavailable"],
			Weekday:          f.Weekday,
			DateLabel:        f.DateLabel,
			TimeRange:        f.TimeRange,
		})
	}
	sorted, best := domain.MarkBest(rows, func(rv views.ResultView) domain.Counts {
		return domain.Counts{Preferred: rv.Preferred, Available: rv.Available, Unavailable: rv.Unavailable}
	})
	for i := range sorted {
		sorted[i].IsBest = best[i]
	}

	options := make([]views.OptionView, 0, len(ev.DateOptions))
	for _, d := range ev.DateOptions {
		c := countsByID[d.ID]
		f := domain.FormatDateOption(d.StartsAt, d.EndsAt, l)
		// Copenhagen wall-clock parts for the edit form's native inputs.
		value, startTime := domain.UTCToZonedParts(d.StartsAt)
		endTime := ""
		if d.EndsAt != "" {
			_, endTime = domain.UTCToZonedParts(d.EndsAt)
		}
		options = append(options, views.OptionView{
			ID: d.ID, Value: value, StartTime: startTime, EndTime: endTime,
			HasResponses: c.Preferred+c.Available+c.Unavailable > 0,
			Weekday:      f.Weekday, DateLabel: f.DateLabel, TimeRange: f.TimeRange,
		})
	}

	invitees := make([]views.InviteeView, 0, len(ev.Invitees))
	for _, inv := range ev.Invitees {
		invitees = append(invitees, views.InviteeView{
			ID: inv.ID, Label: inv.Label, URL: inviteeURL(r, inv.Token),
			Answered: answered[inv.ID], Note: inv.Note,
		})
	}

	// One summary of who has answered. Open mode has no fixed roster, so it drops
	// the "of Y" denominator.
	respondedLabel := i18n.M(l, "answeredLabel", "total", len(answered), "totalInvitees", totalInvitees)
	if ev.PollMode == "open" {
		respondedLabel = i18n.M(l, "answeredLabelOpen", "total", len(answered))
	}

	return views.DashboardView{
		Locale:         l,
		Token:          token,
		OrganizerURL:   organizerURL(r, token),
		ShareURL:       shareURL(r, ev.ShareToken),
		Title:          ev.Title,
		Description:    ev.Description,
		PollMode:       ev.PollMode,
		Closed:         ev.Status == "closed",
		RespondedLabel: respondedLabel,
		Results:        sorted,
		Options:        options,
		Invitees:       invitees,
	}, nil
}

// POST /e/{token} - every action re-resolves the event by token server-side;
// never trust the client for event id or status.
func (a *App) dashboardSubmit(w http.ResponseWriter, r *http.Request) {
	token := r.PathValue("token")
	ev, err := a.store.EventByOrganizerToken(r.Context(), token)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	if ev == nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	if err := r.ParseForm(); err != nil {
		http.Error(w, "bad form", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	l := ev.Locale
	status := http.StatusOK

	switch action(r) {
	case "saveDetails":
		title := field(r, "title")
		if title == "" {
			// Validation error copy renders in the poll's own locale.
			status = http.StatusBadRequest
			break
		}
		if err = a.store.UpdateEventDetails(ctx, ev.ID, title, field(r, "description")); err != nil {
			break
		}
		// Language + mode live in the same edit block; apply them here too. Mode
		// switching keeps every existing invitee and response - it only changes how
		// new people submit.
		if loc := field(r, "locale"); i18n.IsLocale(loc) && i18n.Locale(loc) != ev.Locale {
			err = a.store.SetEventLocale(ctx, ev.ID, i18n.Locale(loc))
		}
		if mode := field(r, "pollMode"); (mode == "assigned" || mode == "open") && mode != ev.PollMode && err == nil {
			err = a.store.SetPollMode(ctx, ev.ID, mode)
		}

	case "addOption":
		d := dateInput(r)
		if d.Value == "" || validateTimes(l, d.StartTime, d.EndTime) != "" {
			status = http.StatusBadRequest
			break
		}
		err = a.store.AddDateOption(ctx, ev.ID, d)

	case "editOption":
		optionID := field(r, "optionId")
		d := dateInput(r)
		if !hasOption(ev, optionID) {
			status = http.StatusNotFound
			break
		}
		if d.Value == "" || validateTimes(l, d.StartTime, d.EndTime) != "" {
			status = http.StatusBadRequest
			break
		}
		err = a.store.UpdateDateOption(ctx, optionID, d)

	case "removeOption":
		optionID := field(r, "optionId")
		if !hasOption(ev, optionID) {
			status = http.StatusNotFound
			break
		}
		err = a.store.RemoveDateOption(ctx, optionID)

	case "addInvitee":
		label := field(r, "label")
		if label == "" {
			status = http.StatusBadRequest
			break
		}
		_, err = a.store.AddInvitee(ctx, ev.ID, label)

	case "renameInvitee":
		inviteeID := field(r, "inviteeId")
		label := field(r, "label")
		if !hasInvitee(ev, inviteeID) {
			status = http.StatusNotFound
			break
		}
		if label == "" {
			status = http.StatusBadRequest
			break
		}
		err = a.store.RenameInvitee(ctx, inviteeID, label)

	case "removeInvitee":
		inviteeID := field(r, "inviteeId")
		if !hasInvitee(ev, inviteeID) {
			status = http.StatusNotFound
			break
		}
		err = a.store.RemoveInvitee(ctx, inviteeID)

	case "close":
		err = a.store.SetEventStatus(ctx, ev.ID, "closed")

	case "reopen":
		err = a.store.SetEventStatus(ctx, ev.ID, "open")

	default:
		status = http.StatusNotFound
	}

	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	// Re-read and re-render so the page reflects the change - the original's
	// `update()` after a successful enhance submit.
	fresh, err := a.store.EventByOrganizerToken(ctx, token)
	if err != nil || fresh == nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	v, err := a.dashboardView(r, fresh, token)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	if status != http.StatusOK {
		w.WriteHeader(status)
	}
	render(w, r, views.DashboardPage(v))
}

func hasOption(ev *db.EventWithDetails, id string) bool {
	for _, d := range ev.DateOptions {
		if d.ID == id {
			return true
		}
	}
	return false
}

func hasInvitee(ev *db.EventWithDetails, id string) bool {
	for _, i := range ev.Invitees {
		if i.ID == id {
			return true
		}
	}
	return false
}
