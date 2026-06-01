package multilang

import "encoding/json"

var defaultPrefs = []string{"en", "hy", "ru"}

func Pick(raw []byte, prefs ...string) string {
	if len(raw) == 0 {
		return ""
	}

	var m map[string]string
	if err := json.Unmarshal(raw, &m); err != nil {
		var s string
		if json.Unmarshal(raw, &s) == nil {
			return s
		}
		return ""
	}

	if len(prefs) == 0 {
		prefs = defaultPrefs
	}
	for _, p := range prefs {
		if v := m[p]; v != "" {
			return v
		}
	}
	for _, v := range m {
		if v != "" {
			return v
		}
	}
	return ""
}
