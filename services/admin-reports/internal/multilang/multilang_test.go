package multilang

import "testing"

func TestPick(t *testing.T) {
	cases := []struct {
		name  string
		raw   string
		prefs []string
		want  string
	}{
		{"prefers en by default", `{"hy":"Անուն","en":"Name","ru":"Имя"}`, nil, "Name"},
		{"falls back to hy when en missing", `{"hy":"Անուն","ru":"Имя"}`, nil, "Անուն"},
		{"explicit pref order", `{"hy":"Անուն","en":"Name"}`, []string{"hy", "en"}, "Անուն"},
		{"skips empty preferred value", `{"en":"","hy":"Անուն"}`, nil, "Անուն"},
		{"plain string", `"Just a string"`, nil, "Just a string"},
		{"empty input", ``, nil, ""},
		{"invalid json", `{not json`, nil, ""},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := Pick([]byte(c.raw), c.prefs...); got != c.want {
				t.Fatalf("Pick(%q) = %q, want %q", c.raw, got, c.want)
			}
		})
	}
}
