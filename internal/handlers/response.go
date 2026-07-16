package handlers

import (
	"net/http"
	"strings"

	"github.com/malpou/poll/internal/db"
	"github.com/malpou/poll/internal/domain"
	"github.com/malpou/poll/internal/i18n"
	"github.com/malpou/poll/internal/views"
)

var preferences = map[string]bool{"preferred": true, "available": true, "unavailable": true}

// cookieName: one cookie per event holds this browser's invitee token, so a
// revisit to the shared link edits in place instead of creating a duplicate.
func cookieName(eventID string) string { return "edit_" + eventID }

func cards(dates []db.DateOption, l i18n.Locale) []views.CardData {
	out := make([]views.CardData, 0, len(dates))
	for _, d := range dates {
		f := domain.FormatDateOption(d.StartsAt, d.EndsAt, l)
		out = append(out, views.CardData{
			ID: d.ID, Weekday: f.Weekday, DateLabel: f.DateLabel, TimeRange: f.TimeRange,
		})
	}
	return out
}

// readAnswers pulls pref.{id} fields for the event's own options only - never
// trust the client for option ids. Unmarked = no field = no row.
func readAnswers(r *http.Request, dates []db.DateOption) []db.ResponseInput {
	var answers []db.ResponseInput
	for _, d := range dates {
		v := r.FormValue("pref." + d.ID)
		if preferences[v] {
			answers = append(answers, db.ResponseInput{DateOptionID: d.ID, Preference: v})
		}
	}
	return answers
}

// renderNotFound writes the friendly not-found page inside the layout.
func renderNotFound(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusNotFound)
	_ = views.NotFoundPage(i18n.Base).Render(r.Context(), w)
}

// GET /r/{token}
func (a *App) responsePage(w http.ResponseWriter, r *http.Request) {
	ctx, err := a.store.InviteeContext(r.Context(), r.PathValue("token"))
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	if ctx == nil {
		renderNotFound(w, r)
		return
	}

	answers := map[string]string{}
	for _, resp := range ctx.Responses {
		answers[resp.DateOptionID] = resp.Preference
	}

	v := views.ResponseView{
		Locale:      ctx.Event.Locale,
		Mode:        "assigned",
		Action:      "?/save",
		Closed:      ctx.Event.Status == "closed",
		Name:        ctx.Invitee.Label,
		Title:       ctx.Event.Title,
		Description: ctx.Event.Description,
		Dates:       cards(ctx.DateOptions, ctx.Event.Locale),
		Answers:     answers,
		Note:        ctx.Invitee.Note,
		Submitted:   len(answers) > 0,
	}
	render(w, r, views.ResponsePage(v))
}

// POST /r/{token} (?/save)
func (a *App) responseSubmit(w http.ResponseWriter, r *http.Request) {
	token := r.PathValue("token")
	// Re-fetch server-side: never trust the client for invitee id, option ids, or
	// status. Closed events are read-only here too, not just in the UI.
	ctx, err := a.store.InviteeContext(r.Context(), token)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	if ctx == nil {
		renderNotFound(w, r)
		return
	}
	if ctx.Event.Status == "closed" {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	if err := r.ParseForm(); err != nil {
		http.Error(w, "bad form", http.StatusBadRequest)
		return
	}
	answers := readAnswers(r, ctx.DateOptions)
	if err := a.store.SaveResponses(r.Context(), ctx.Invitee.ID, answers); err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	if err := a.store.SaveNote(r.Context(), ctx.Invitee.ID, strings.TrimSpace(r.FormValue("note"))); err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	// Re-render in the saved state - the HTMX swap replaces the page body.
	answered := map[string]string{}
	for _, ans := range answers {
		answered[ans.DateOptionID] = ans.Preference
	}
	v := views.ResponseView{
		Locale:      ctx.Event.Locale,
		Mode:        "assigned",
		Action:      "?/save",
		Name:        ctx.Invitee.Label,
		Title:       ctx.Event.Title,
		Description: ctx.Event.Description,
		Dates:       cards(ctx.DateOptions, ctx.Event.Locale),
		Answers:     answered,
		Note:        strings.TrimSpace(r.FormValue("note")),
		Submitted:   true,
	}
	render(w, r, views.ResponsePage(v))
}

// GET /s/{token}
func (a *App) sharePage(w http.ResponseWriter, r *http.Request) {
	ctx, err := a.store.ShareContext(r.Context(), r.PathValue("token"))
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	// Unknown token or not an open poll - reveal nothing (same as /r, /e).
	if ctx == nil {
		renderNotFound(w, r)
		return
	}

	// Already submitted from this browser? Edit that answer on /r instead.
	if c, err := r.Cookie(cookieName(ctx.Event.ID)); err == nil && c.Value != "" {
		http.Redirect(w, r, "/r/"+c.Value, http.StatusSeeOther)
		return
	}

	v := views.ResponseView{
		Locale:      ctx.Event.Locale,
		Mode:        "open",
		Action:      "?/submit",
		Closed:      ctx.Event.Status == "closed",
		Title:       ctx.Event.Title,
		Description: ctx.Event.Description,
		Dates:       cards(ctx.DateOptions, ctx.Event.Locale),
		Answers:     map[string]string{},
	}
	render(w, r, views.ResponsePage(v))
}

// POST /s/{token} (?/submit)
func (a *App) shareSubmit(w http.ResponseWriter, r *http.Request) {
	ctx, err := a.store.ShareContext(r.Context(), r.PathValue("token"))
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	if ctx == nil {
		renderNotFound(w, r)
		return
	}
	if ctx.Event.Status == "closed" {
		w.WriteHeader(http.StatusForbidden)
		return
	}
	if err := r.ParseForm(); err != nil {
		http.Error(w, "bad form", http.StatusBadRequest)
		return
	}

	name := field(r, "name")
	if name == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	answers := readAnswers(r, ctx.DateOptions)
	note := field(r, "note")

	token, err := a.store.SubmitOpenResponse(r.Context(), ctx.Event.ID, name, answers, note)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	// Remember this browser's submission so a revisit edits it.
	http.SetCookie(w, &http.Cookie{
		Name:     cookieName(ctx.Event.ID),
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   60 * 60 * 24 * 180,
	})

	answered := map[string]string{}
	for _, ans := range answers {
		answered[ans.DateOptionID] = ans.Preference
	}
	v := views.ResponseView{
		Locale:      ctx.Event.Locale,
		Mode:        "open",
		Action:      "?/submit",
		Name:        name,
		Title:       ctx.Event.Title,
		Description: ctx.Event.Description,
		Dates:       cards(ctx.DateOptions, ctx.Event.Locale),
		Answers:     answered,
		Note:        note,
		Submitted:   true,
		EditURL:     inviteeURL(r, token),
	}
	render(w, r, views.ResponsePage(v))
}
