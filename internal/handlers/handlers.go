// HTTP layer. Routes mirror the original SvelteKit app 1:1, including its form
// -action convention: a POST to `?/save` carries the action in the query string
// (`form action="?/save"`). The e2e specs select forms by that exact attribute,
// so the convention is part of the contract, not an implementation detail.
package handlers

import (
	"net/http"
	"strings"

	"github.com/a-h/templ"

	"github.com/malpou/poll/internal/db"
	"github.com/malpou/poll/internal/i18n"
)

type App struct {
	store *db.Store
}

// render writes a templ component as the HTML response.
func render(w http.ResponseWriter, r *http.Request, c templ.Component) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := c.Render(r.Context(), w); err != nil {
		http.Error(w, "render error", http.StatusInternalServerError)
	}
}

// redirect sends the browser to a new page. Forms post through HTMX (so a
// validation failure re-renders in place without changing the URL, as
// use:enhance did), and HTMX swallows a 303 - HX-Redirect is how you ask it to
// navigate for real. Plain requests still get an ordinary 303.
func redirect(w http.ResponseWriter, r *http.Request, to string) {
	if r.Header.Get("HX-Request") == "true" {
		w.Header().Set("HX-Redirect", to)
		w.WriteHeader(http.StatusOK)
		return
	}
	http.Redirect(w, r, to, http.StatusSeeOther)
}

func Router(store *db.Store) http.Handler {
	a := &App{store: store}
	mux := http.NewServeMux()

	mux.Handle("GET /static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	mux.HandleFunc("GET /{$}", a.createPage)
	mux.HandleFunc("POST /{$}", a.createSubmit)
	mux.HandleFunc("GET /r/{token}", a.responsePage)
	mux.HandleFunc("POST /r/{token}", a.responseSubmit)
	mux.HandleFunc("GET /s/{token}", a.sharePage)
	mux.HandleFunc("POST /s/{token}", a.shareSubmit)
	mux.HandleFunc("GET /e/{token}", a.dashboardPage)
	mux.HandleFunc("POST /e/{token}", a.dashboardSubmit)
	return mux
}

// action reads SvelteKit's `?/name` form-action convention off the query string.
func action(r *http.Request) string {
	for k := range r.URL.Query() {
		if strings.HasPrefix(k, "/") {
			return strings.TrimPrefix(k, "/")
		}
	}
	return ""
}

// field reads one trimmed string field; "" when absent. Port of forms.ts field().
func field(r *http.Request, key string) string {
	return strings.TrimSpace(r.FormValue(key))
}

// validateTimes ports forms.ts validateTimes(): end requires start, end must not
// precede start. Returns a localised error string or "".
func validateTimes(l i18n.Locale, startTime, endTime string) string {
	if endTime != "" && startTime == "" {
		return i18n.M(l, "errorEndNeedsStart")
	}
	if startTime != "" && endTime != "" && endTime < startTime {
		return i18n.M(l, "errorEndBeforeStart")
	}
	return ""
}

// origin rebuilds the absolute request origin, so copied links carry the host the
// user actually reached us on (a custom-domain route can rewrite it).
func origin(r *http.Request) string {
	scheme := "http"
	if r.TLS != nil {
		scheme = "https"
	}
	if p := r.Header.Get("X-Forwarded-Proto"); p != "" {
		scheme = p
	}
	return scheme + "://" + r.Host
}

func inviteeURL(r *http.Request, token string) string   { return origin(r) + "/r/" + token }
func organizerURL(r *http.Request, token string) string { return origin(r) + "/e/" + token }
func shareURL(r *http.Request, token string) string     { return origin(r) + "/s/" + token }
