package report

import (
	"context"
	"time"

	"golang.org/x/sync/errgroup"

	"github.com/vendorex/admin-reports/internal/multilang"
	"github.com/vendorex/admin-reports/internal/store"
)

type Service struct {
	s *store.Store
}

func New(s *store.Store) *Service {
	return &Service{s: s}
}

type StatusBlock struct {
	Total    int64            `json:"total"`
	ByStatus map[string]int64 `json:"by_status"`
}

type StoresBlock struct {
	Total    int64            `json:"total"`
	ByStatus map[string]int64 `json:"by_status"`
	Featured int64            `json:"featured"`
}

type RevenueBlock struct {
	GMV          float64 `json:"gmv"`
	PaidOrders   int64   `json:"paid_orders"`
	AverageOrder float64 `json:"average_order_value"`
	Currency     string  `json:"currency"`
}

type RecentBlock struct {
	NewStores int64   `json:"new_stores"`
	NewOrders int64   `json:"new_orders"`
	Revenue   float64 `json:"revenue"`
}

type StoreRevenueDTO struct {
	ID      int64   `json:"id"`
	Name    string  `json:"name"`
	Slug    string  `json:"slug"`
	Revenue float64 `json:"revenue"`
}

type Overview struct {
	GeneratedAt string            `json:"generated_at"`
	Stores      StoresBlock       `json:"stores"`
	Sellers     StatusBlock       `json:"sellers"`
	Products    StatusBlock       `json:"products"`
	Orders      StatusBlock       `json:"orders"`
	Revenue     RevenueBlock      `json:"revenue"`
	Last30Days  RecentBlock       `json:"last_30_days"`
	TopStores   []StoreRevenueDTO `json:"top_stores"`
}

func (svc *Service) Overview(ctx context.Context) (Overview, error) {
	var ov Overview
	since := time.Now().AddDate(0, 0, -30)

	g, ctx := errgroup.WithContext(ctx)

	g.Go(func() error {
		m, err := svc.s.StoreStatusCounts(ctx)
		if err != nil {
			return err
		}
		ov.Stores.ByStatus, ov.Stores.Total = m, sumMap(m)
		return nil
	})
	g.Go(func() error {
		n, err := svc.s.StoreFeaturedCount(ctx)
		ov.Stores.Featured = n
		return err
	})
	g.Go(func() error {
		m, err := svc.s.SellerStatusCounts(ctx)
		if err != nil {
			return err
		}
		ov.Sellers = StatusBlock{Total: sumMap(m), ByStatus: m}
		return nil
	})
	g.Go(func() error {
		m, err := svc.s.ProductStatusCounts(ctx)
		if err != nil {
			return err
		}
		ov.Products = StatusBlock{Total: sumMap(m), ByStatus: m}
		return nil
	})
	g.Go(func() error {
		m, err := svc.s.OrderStatusCounts(ctx)
		if err != nil {
			return err
		}
		ov.Orders = StatusBlock{Total: sumMap(m), ByStatus: m}
		return nil
	})
	g.Go(func() error {
		gmv, paid, err := svc.s.Revenue(ctx)
		if err != nil {
			return err
		}
		ov.Revenue = RevenueBlock{GMV: gmv, PaidOrders: paid, Currency: "AMD"}
		if paid > 0 {
			ov.Revenue.AverageOrder = gmv / float64(paid)
		}
		return nil
	})
	g.Go(func() error {
		n, err := svc.s.NewStoresSince(ctx, since)
		ov.Last30Days.NewStores = n
		return err
	})
	g.Go(func() error {
		n, err := svc.s.NewOrdersSince(ctx, since)
		ov.Last30Days.NewOrders = n
		return err
	})
	g.Go(func() error {
		n, err := svc.s.RevenueSince(ctx, since)
		ov.Last30Days.Revenue = n
		return err
	})
	g.Go(func() error {
		rows, err := svc.s.TopStoresByRevenue(ctx, 5)
		if err != nil {
			return err
		}
		top := make([]StoreRevenueDTO, 0, len(rows))
		for _, r := range rows {
			top = append(top, StoreRevenueDTO{ID: r.ID, Name: multilang.Pick(r.Name), Slug: r.Slug, Revenue: r.Revenue})
		}
		ov.TopStores = top
		return nil
	})

	if err := g.Wait(); err != nil {
		return Overview{}, err
	}

	ov.GeneratedAt = time.Now().UTC().Format(time.RFC3339)
	return ov, nil
}

func sumMap(m map[string]int64) int64 {
	var total int64
	for _, v := range m {
		total += v
	}
	return total
}
