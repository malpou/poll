// Locale-aware date rendering for date options, Europe/Copenhagen.
//
// The stdlib carries no CLDR data, so the weekday/month names and the per-locale
// date/time shapes below are spelled out here for da-DK, en-GB and fr-FR;
// date_test.go pins every string. Note Danish writes the time with a dot
// (kl. 10.00) where en/fr use a colon (at 10:00) - a real locale difference, not
// a typo.
package domain

import (
	"fmt"
	"time"

	"github.com/malpou/poll/internal/i18n"
)

const TZName = "Europe/Copenhagen"

var TZ = mustTZ()

func mustTZ() *time.Location {
	l, err := time.LoadLocation(TZName)
	if err != nil {
		panic("date: no tzdata for " + TZName + ": " + err.Error())
	}
	return l
}

// Weekday names, index by time.Weekday (Sunday=0).
var weekdays = map[i18n.Locale][7]string{
	i18n.Da: {"søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"},
	i18n.En: {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"},
	i18n.Fr: {"dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"},
}

// Month names, index by time.Month-1 (January=0).
var months = map[i18n.Locale][12]string{
	i18n.Da: {"januar", "februar", "marts", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"},
	i18n.En: {"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"},
	i18n.Fr: {"janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"},
}

type FormattedDate struct {
	Weekday   string // "lørdag"
	DateLabel string // "12. september 2026"
	TimeRange string // "kl. 10.00–11.00", "kl. 10.00", or ""
}

func loc(l i18n.Locale) i18n.Locale {
	if _, ok := weekdays[l]; !ok {
		return i18n.Base
	}
	return l
}

// "12. september 2026" (da) / "12 September 2026" (en) / "12 septembre 2026" (fr).
func dateLabel(t time.Time, l i18n.Locale) string {
	mo := months[loc(l)][int(t.Month())-1]
	if loc(l) == i18n.Da {
		return fmt.Sprintf("%d. %s %d", t.Day(), mo, t.Year())
	}
	return fmt.Sprintf("%d %s %d", t.Day(), mo, t.Year())
}

// "10.00" (da) / "10:00" (en, fr) - 2-digit, 24h, separator per locale.
func timeLabel(t time.Time, l i18n.Locale) string {
	sep := ":"
	if loc(l) == i18n.Da {
		sep = "."
	}
	return fmt.Sprintf("%02d%s%02d", t.Hour(), sep, t.Minute())
}

// ZonedToUTC turns a yyyy-mm-dd + hh:mm Copenhagen wall-clock into a UTC ISO
// instant. Blank date => empty (NULL). Blank time => local midnight.
func ZonedToUTC(value, timeStr string) (string, bool) {
	if value == "" {
		return "", false
	}
	if timeStr == "" {
		timeStr = "00:00"
	}
	t, err := time.ParseInLocation("2006-01-02 15:04", value+" "+timeStr, TZ)
	if err != nil {
		return "", false
	}
	return t.UTC().Format("2006-01-02T15:04:05.000Z"), true
}

// UTCToZonedParts turns a stored UTC ISO instant back into the Copenhagen
// wall-clock parts the native date/time inputs need.
func UTCToZonedParts(iso string) (value, timeStr string) {
	t, ok := parseISO(iso)
	if !ok {
		return "", ""
	}
	z := t.In(TZ)
	return z.Format("2006-01-02"), z.Format("15:04")
}

// Stored instants are RFC3339, with or without millis depending on whether the
// app or a test seed wrote them. Accept both rather than force one shape.
func parseISO(iso string) (time.Time, bool) {
	if iso == "" {
		return time.Time{}, false
	}
	for _, layout := range []string{time.RFC3339Nano, time.RFC3339, "2006-01-02T15:04:05Z", "2006-01-02 15:04:05"} {
		if t, err := time.Parse(layout, iso); err == nil {
			return t, true
		}
	}
	return time.Time{}, false
}

// FormatDateOption renders one date option's labels. A missing startsAt renders
// blank rather than crashing; the create form requires a date, so this is only
// reached if the data is malformed.
func FormatDateOption(startsAt, endsAt string, l i18n.Locale) FormattedDate {
	start, ok := parseISO(startsAt)
	if !ok {
		return FormattedDate{}
	}
	s := start.In(TZ)
	at := i18n.M(l, "timeAt") // "kl. " / "at " / "à "
	timeRange := at + timeLabel(s, l)
	if end, ok := parseISO(endsAt); ok {
		timeRange = at + timeLabel(s, l) + "–" + timeLabel(end.In(TZ), l)
	}
	return FormattedDate{
		Weekday:   weekdays[loc(l)][int(s.Weekday())],
		DateLabel: dateLabel(s, l),
		TimeRange: timeRange,
	}
}
