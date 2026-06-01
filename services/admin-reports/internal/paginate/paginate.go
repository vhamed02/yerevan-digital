package paginate

type Params struct {
	Page    int
	PerPage int
}

func Parse(page, perPage, defaultPer, maxPer int) Params {
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = defaultPer
	}
	if perPage > maxPer {
		perPage = maxPer
	}
	return Params{Page: page, PerPage: perPage}
}

func (p Params) Offset() int {
	return (p.Page - 1) * p.PerPage
}

type Meta struct {
	Page     int   `json:"page"`
	PerPage  int   `json:"per_page"`
	Total    int64 `json:"total"`
	LastPage int   `json:"last_page"`
}

func (p Params) Meta(total int64) Meta {
	last := 1
	if p.PerPage > 0 {
		last = int((total + int64(p.PerPage) - 1) / int64(p.PerPage))
		if last < 1 {
			last = 1
		}
	}
	return Meta{Page: p.Page, PerPage: p.PerPage, Total: total, LastPage: last}
}
