package handlers

import (
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/malpou/poll/internal/db"
	"github.com/malpou/poll/internal/domain"
	"github.com/malpou/poll/internal/i18n"
	"github.com/malpou/poll/internal/views"
)

// suggestedLocale renders the create page in the visitor's own preferred
// language (it's the organizer's page, pre-submit; every other page uses the
// poll's stored locale). Falls back to the base locale.
func suggestedLocale(r *http.Request) i18n.Locale {
	// An explicit ?locale= wins - that's the live language picker asking for the
	// form in a new language.
	if q := r.URL.Query().Get("locale"); i18n.IsLocale(q) {
		return i18n.Locale(q)
	}
	return localeFromHeader(r.Header.Get("Accept-Language"))
}

// localeFromHeader picks the first supported locale in an Accept-Language header,
// honouring q-weights the way the browser means them.
func localeFromHeader(header string) i18n.Locale {
	type cand struct {
		loc i18n.Locale
		q   float64
	}
	best := cand{i18n.Base, -1}
	for _, part := range strings.Split(header, ",") {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		tag, q := part, 1.0
		if i := strings.Index(part, ";"); i >= 0 {
			tag = strings.TrimSpace(part[:i])
			if v := strings.TrimPrefix(strings.TrimSpace(part[i+1:]), "q="); v != part[i+1:] {
				if f, err := strconv.ParseFloat(v, 64); err == nil {
					q = f
				}
			}
		}
		// "da-DK" -> "da"
		if i := strings.Index(tag, "-"); i >= 0 {
			tag = tag[:i]
		}
		if i18n.IsLocale(tag) && q > best.q {
			best = cand{i18n.Locale(tag), q}
		}
	}
	return best.loc
}

var indexedRe = regexp.MustCompile(`^(\w+)\.(\d+)\.(\w+)$`)

// parseIndexed rebuilds the dates/participants arrays from indexed named inputs
// (dates.0.value, participants.1.token).
func parseIndexed(r *http.Request, prefix string) []map[string]string {
	rows := map[int]map[string]string{}
	maxIdx := -1
	for key, vals := range r.Form {
		m := indexedRe.FindStringSubmatch(key)
		if m == nil || m[1] != prefix || len(vals) == 0 {
			continue
		}
		i, err := strconv.Atoi(m[2])
		if err != nil {
			continue
		}
		if rows[i] == nil {
			rows[i] = map[string]string{}
		}
		rows[i][m[3]] = strings.TrimSpace(vals[0])
		if i > maxIdx {
			maxIdx = i
		}
	}
	out := make([]map[string]string, 0, len(rows))
	for i := 0; i <= maxIdx; i++ {
		if row, ok := rows[i]; ok {
			out = append(out, row)
		}
	}
	return out
}

// GET /
func (a *App) createPage(w http.ResponseWriter, r *http.Request) {
	l := suggestedLocale(r)
	// The language picker re-fetches this page with the typed values attached
	// (hx-include), so echo them back rather than blanking the form.
	_ = r.ParseForm()
	v := views.CreateView{
		Locale:      l,
		Title:       r.FormValue("title"),
		Description: r.FormValue("description"),
		PollMode:    r.FormValue("pollMode"),
		Dates:       dateRowsFrom(r),
		People:      personRowsFrom(r),
	}
	render(w, r, views.CreatePage(v))
}

// dateRowsFrom echoes submitted date rows back, or one blank row on a fresh page.
func dateRowsFrom(r *http.Request) []views.DateRowData {
	rows := parseIndexed(r, "dates")
	if len(rows) == 0 {
		return []views.DateRowData{{}}
	}
	out := make([]views.DateRowData, 0, len(rows))
	for _, row := range rows {
		out = append(out, views.DateRowData{
			Value: row["value"], StartTime: row["startTime"], EndTime: row["endTime"],
		})
	}
	return out
}

// personRowsFrom echoes submitted participants back, or one blank row with a
// fresh token on a first render.
func personRowsFrom(r *http.Request) []views.PersonRowData {
	rows := parseIndexed(r, "participants")
	if len(rows) == 0 {
		return []views.PersonRowData{{Token: domain.NewToken()}}
	}
	out := make([]views.PersonRowData, 0, len(rows))
	for _, row := range rows {
		token := row["token"]
		if token == "" {
			token = domain.NewToken()
		}
		out = append(out, views.PersonRowData{Name: row["name"], Token: token})
	}
	return out
}

// POST / (?/create)
func (a *App) createSubmit(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "bad form", http.StatusBadRequest)
		return
	}

	title := field(r, "title")
	description := field(r, "description")
	locale := i18n.Base
	if v := field(r, "locale"); i18n.IsLocale(v) {
		locale = i18n.Locale(v)
	}
	pollMode := "assigned"
	if field(r, "pollMode") == "open" {
		pollMode = "open"
	}

	// Drop rows the user added but never filled with a date.
	var dates []db.DateInput
	for _, row := range parseIndexed(r, "dates") {
		if row["value"] == "" {
			continue
		}
		dates = append(dates, db.DateInput{
			Value: row["value"], StartTime: row["startTime"], EndTime: row["endTime"],
		})
	}

	// Open mode has no named list - anyone submits via the shared link.
	var participants []struct{ Name, Token string }
	if pollMode == "assigned" {
		for _, row := range parseIndexed(r, "participants") {
			if row["name"] == "" {
				continue
			}
			token := row["token"]
			if token == "" {
				token = domain.NewToken()
			}
			participants = append(participants, struct{ Name, Token string }{row["name"], token})
		}
	}

	// Validation order: title, then dates, then times.
	errMsg := ""
	switch {
	case title == "":
		errMsg = i18n.M(locale, "errorNoTitle")
	case len(dates) == 0:
		errMsg = i18n.M(locale, "errorNoDates")
	default:
		for _, d := range dates {
			if e := validateTimes(locale, d.StartTime, d.EndTime); e != "" {
				errMsg = e
				break
			}
		}
	}
	if errMsg != "" {
		// Re-render with the values kept, no redirect - the specs assert the URL
		// stays "/" and the message shows.
		w.WriteHeader(http.StatusBadRequest)
		render(w, r, views.CreatePage(views.CreateView{
			Locale:      locale,
			Title:       title,
			Description: description,
			PollMode:    pollMode,
			Dates:       dateRowsFrom(r),
			People:      personRowsFrom(r),
			Error:       errMsg,
		}))
		return
	}

	token, err := a.store.CreateEvent(r.Context(), db.Draft{
		Title: title, Description: description, Locale: locale,
		PollMode: pollMode, Dates: dates, Participants: participants,
	})
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	redirect(w, r, "/e/"+token)
}
