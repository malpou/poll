package views

import (
	"encoding/json"
	"strconv"
	"strings"
)

// Small shared helpers for the templates. Plain Go (not .templ) - they're
// functions, not markup.

func ternary(cond bool, a, b string) string {
	if cond {
		return a
	}
	return b
}

// stripScheme drops the protocol for display. The full URL still goes to the
// clipboard; only the chip shows the short form.
func stripScheme(u string) string {
	for _, p := range []string{"https://", "http://"} {
		if strings.HasPrefix(u, p) {
			return strings.TrimPrefix(u, p)
		}
	}
	return u
}

// jsEscape makes a Go string safe to embed inside a single-quoted JS literal in
// an Alpine expression attribute. templ escapes the attribute itself; this
// guards the JS string layer inside it.
func jsEscape(s string) string {
	b, err := json.Marshal(s)
	if err != nil {
		return ""
	}
	// json.Marshal returns a double-quoted literal; strip the quotes and escape
	// single quotes for the surrounding '...' context.
	inner := string(b[1 : len(b)-1])
	return strings.ReplaceAll(inner, "'", `\'`)
}

func pctStyle(pct int) string { return strconv.Itoa(pct) + "%" }

func joinNames(names []string) string { return strings.Join(names, ", ") }

// indexedName builds the create form's indexed input names (dates.0.value,
// participants.1.token). The handler rebuilds the arrays from these.
func indexedName(prefix string, i int, field string) string {
	return prefix + "." + strconv.Itoa(i) + "." + field
}
