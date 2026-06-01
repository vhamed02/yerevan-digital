package auth

import "testing"

func TestParseBearer(t *testing.T) {
	cases := []struct {
		name      string
		header    string
		wantID    string
		wantPlain string
		wantOK    bool
	}{
		{"valid", "Bearer 12|abcDEF", "12", "abcDEF", true},
		{"case insensitive scheme", "bearer 7|xyz", "7", "xyz", true},
		{"wrong scheme", "Token 12|abc", "", "", false},
		{"missing pipe", "Bearer noPipe", "", "", false},
		{"empty plaintext", "Bearer 12|", "", "", false},
		{"empty id", "Bearer |abc", "", "", false},
		{"empty header", "", "", "", false},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			id, plain, ok := ParseBearer(c.header)
			if id != c.wantID || plain != c.wantPlain || ok != c.wantOK {
				t.Fatalf("ParseBearer(%q) = (%q, %q, %v), want (%q, %q, %v)",
					c.header, id, plain, ok, c.wantID, c.wantPlain, c.wantOK)
			}
		})
	}
}

func TestHashToken(t *testing.T) {
	got := HashToken("test")
	want := "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
	if got != want {
		t.Fatalf("HashToken(\"test\") = %s, want %s", got, want)
	}
}
