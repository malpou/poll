package domain

import (
	"testing"

	"github.com/malpou/poll/internal/i18n"
)

// The exact strings each locale renders (da-DK/en-GB/fr-FR, Europe/Copenhagen).
// The e2e specs assert on these, so they are the contract: pin them here and a
// formatting regression fails fast, in milliseconds, instead of in the browser.
func TestFormatDateOption(t *testing.T) {
	cases := []struct {
		name             string
		startsAt, endsAt string
		locale           i18n.Locale
		want             FormattedDate
	}{
		{
			// response.spec.ts: 2026-09-12T08:00Z is CEST (UTC+2) => 10.00 local, lørdag.
			name: "da with end time", startsAt: "2026-09-12T08:00:00Z", endsAt: "2026-09-12T09:00:00Z", locale: i18n.Da,
			want: FormattedDate{Weekday: "lørdag", DateLabel: "12. september 2026", TimeRange: "kl. 10.00–11.00"},
		},
		{
			name: "da start only", startsAt: "2026-09-20T09:00:00Z", locale: i18n.Da,
			want: FormattedDate{Weekday: "søndag", DateLabel: "20. september 2026", TimeRange: "kl. 11.00"},
		},
		{
			// locale.spec.ts asserts samedi / septembre / "à 10:00".
			name: "fr with end time", startsAt: "2026-09-12T08:00:00Z", endsAt: "2026-09-12T09:00:00Z", locale: i18n.Fr,
			want: FormattedDate{Weekday: "samedi", DateLabel: "12 septembre 2026", TimeRange: "à 10:00–11:00"},
		},
		{
			name: "en start only", startsAt: "2026-09-12T08:00:00Z", locale: i18n.En,
			want: FormattedDate{Weekday: "Saturday", DateLabel: "12 September 2026", TimeRange: "at 10:00"},
		},
		{
			// Winter instant: CET (UTC+1) => 09.00 local, not 10.00.
			name: "da winter CET", startsAt: "2026-01-10T08:00:00Z", locale: i18n.Da,
			want: FormattedDate{Weekday: "lørdag", DateLabel: "10. januar 2026", TimeRange: "kl. 09.00"},
		},
		{
			name: "missing start renders blank", startsAt: "", locale: i18n.Da,
			want: FormattedDate{},
		},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := FormatDateOption(c.startsAt, c.endsAt, c.locale)
			if got != c.want {
				t.Errorf("got %+v want %+v", got, c.want)
			}
		})
	}
}

// Round-trip: a Copenhagen wall-clock -> UTC -> back must be stable across both
// DST offsets. This is where a naive UTC-as-local port silently drifts an hour.
func TestZonedRoundTrip(t *testing.T) {
	cases := []struct{ date, clock, wantUTC string }{
		{"2026-09-12", "10:00", "2026-09-12T08:00:00.000Z"}, // CEST +2
		{"2026-01-10", "10:00", "2026-01-10T09:00:00.000Z"}, // CET  +1
		{"2026-09-12", "", "2026-09-11T22:00:00.000Z"},      // blank time => local midnight
	}
	for _, c := range cases {
		got, ok := ZonedToUTC(c.date, c.clock)
		if !ok || got != c.wantUTC {
			t.Fatalf("ZonedToUTC(%q,%q) = %q,%v want %q", c.date, c.clock, got, ok, c.wantUTC)
		}
		if c.clock != "" {
			v, tm := UTCToZonedParts(got)
			if v != c.date || tm != c.clock {
				t.Errorf("round-trip got %q %q want %q %q", v, tm, c.date, c.clock)
			}
		}
	}
	if _, ok := ZonedToUTC("", "10:00"); ok {
		t.Error("blank date should yield no instant")
	}
}
