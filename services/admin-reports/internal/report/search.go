package report

import (
	"context"
	"strings"

	"golang.org/x/sync/errgroup"

	"github.com/vendorex/admin-reports/internal/multilang"
)

type SearchHit struct {
	Type     string `json:"type"`
	ID       int64  `json:"id"`
	UUID     string `json:"uuid"`
	Label    string `json:"label"`
	Sublabel string `json:"sublabel"`
}

type SearchResults struct {
	Query    string      `json:"query"`
	Stores   []SearchHit `json:"stores"`
	Products []SearchHit `json:"products"`
	Sellers  []SearchHit `json:"sellers"`
	Orders   []SearchHit `json:"orders"`
}

func (svc *Service) Search(ctx context.Context, q string, limit int) (SearchResults, error) {
	res := SearchResults{
		Query:    q,
		Stores:   []SearchHit{},
		Products: []SearchHit{},
		Sellers:  []SearchHit{},
		Orders:   []SearchHit{},
	}
	if strings.TrimSpace(q) == "" {
		return res, nil
	}

	g, ctx := errgroup.WithContext(ctx)

	g.Go(func() error {
		hits, err := svc.s.SearchStores(ctx, q, limit)
		if err != nil {
			return err
		}
		for _, h := range hits {
			res.Stores = append(res.Stores, SearchHit{Type: "store", ID: h.ID, UUID: h.UUID, Label: multilang.Pick(h.Name), Sublabel: h.Slug})
		}
		return nil
	})
	g.Go(func() error {
		hits, err := svc.s.SearchProducts(ctx, q, limit)
		if err != nil {
			return err
		}
		for _, h := range hits {
			res.Products = append(res.Products, SearchHit{Type: "product", ID: h.ID, UUID: h.UUID, Label: multilang.Pick(h.Name), Sublabel: multilang.Pick(h.StoreName)})
		}
		return nil
	})
	g.Go(func() error {
		hits, err := svc.s.SearchSellers(ctx, q, limit)
		if err != nil {
			return err
		}
		for _, h := range hits {
			res.Sellers = append(res.Sellers, SearchHit{Type: "seller", ID: h.ID, UUID: h.UUID, Label: h.Name, Sublabel: h.Email})
		}
		return nil
	})
	g.Go(func() error {
		hits, err := svc.s.SearchOrders(ctx, q, limit)
		if err != nil {
			return err
		}
		for _, h := range hits {
			label := h.OrderNumber.String
			if label == "" {
				label = h.Customer
			}
			res.Orders = append(res.Orders, SearchHit{Type: "order", ID: h.ID, UUID: h.UUID, Label: label, Sublabel: multilang.Pick(h.StoreName)})
		}
		return nil
	})

	if err := g.Wait(); err != nil {
		return SearchResults{}, err
	}
	return res, nil
}
