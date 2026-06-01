package paginate

import "testing"

func TestParseClamps(t *testing.T) {
	cases := []struct {
		page, perPage, wantPage, wantPer int
	}{
		{0, 0, 1, 20},
		{-5, 0, 1, 20},
		{3, 200, 3, 50},
		{2, 10, 2, 10},
	}
	for _, c := range cases {
		p := Parse(c.page, c.perPage, 20, 50)
		if p.Page != c.wantPage || p.PerPage != c.wantPer {
			t.Fatalf("Parse(%d,%d) = {%d,%d}, want {%d,%d}",
				c.page, c.perPage, p.Page, p.PerPage, c.wantPage, c.wantPer)
		}
	}
}

func TestOffsetAndMeta(t *testing.T) {
	p := Parse(3, 20, 20, 50)
	if p.Offset() != 40 {
		t.Fatalf("Offset() = %d, want 40", p.Offset())
	}
	m := p.Meta(95)
	if m.LastPage != 5 || m.Total != 95 {
		t.Fatalf("Meta(95) = %+v, want LastPage 5, Total 95", m)
	}
	if empty := Parse(1, 20, 20, 50).Meta(0); empty.LastPage != 1 {
		t.Fatalf("Meta(0).LastPage = %d, want 1", empty.LastPage)
	}
}
