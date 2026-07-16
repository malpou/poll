// Messages come from the same messages/{da,en,fr}.json the e2e specs import via
// Paraglide. One source of truth, two consumers: Go renders them, the tests
// assert them. Keep the JSON files authoritative - never hardcode copy here.
package i18n

import (
	"encoding/json"
	"fmt"
	"strings"

	poll "github.com/malpou/poll"
)

type Locale string

const (
	Da   Locale = "da"
	En   Locale = "en"
	Fr   Locale = "fr"
	Base Locale = Da // baseLocale in paraglide runtime
)

var Locales = []Locale{Da, En, Fr}

func IsLocale(s string) bool {
	for _, l := range Locales {
		if string(l) == s {
			return true
		}
	}
	return false
}

var bundles = map[Locale]map[string]string{}

func init() {
	for _, l := range Locales {
		b, err := poll.Messages.ReadFile("messages/" + string(l) + ".json")
		if err != nil {
			panic(fmt.Sprintf("i18n: missing bundle %s: %v", l, err))
		}
		var raw map[string]any
		if err := json.Unmarshal(b, &raw); err != nil {
			panic(fmt.Sprintf("i18n: bad bundle %s: %v", l, err))
		}
		msgs := map[string]string{}
		for k, v := range raw {
			if s, ok := v.(string); ok && k != "$schema" {
				msgs[k] = s
			}
		}
		bundles[l] = msgs
	}
}

// M renders one message in the given locale, substituting {name} placeholders.
// Falls back to the base locale, then to the key itself, mirroring paraglide.
func M(l Locale, key string, args ...any) string {
	msgs, ok := bundles[l]
	if !ok {
		msgs = bundles[Base]
	}
	s, ok := msgs[key]
	if !ok {
		if s, ok = bundles[Base][key]; !ok {
			return key
		}
	}
	if len(args) == 0 {
		return s
	}
	// args are alternating name, value pairs: M(l, "greeting", "name", "Anna")
	for i := 0; i+1 < len(args); i += 2 {
		name, _ := args[i].(string)
		s = strings.ReplaceAll(s, "{"+name+"}", fmt.Sprint(args[i+1]))
	}
	return s
}
