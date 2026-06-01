package store

import (
	"context"
	"time"
)

type StoreRevenue struct {
	ID      int64   `db:"id"`
	Name    []byte  `db:"name"`
	Slug    string  `db:"slug"`
	Revenue float64 `db:"revenue"`
}

func (s *Store) groupCount(ctx context.Context, query string, args ...any) (map[string]int64, error) {
	rows, err := s.db.QueryxContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make(map[string]int64)
	for rows.Next() {
		var key string
		var count int64
		if err := rows.Scan(&key, &count); err != nil {
			return nil, err
		}
		out[key] = count
	}
	return out, rows.Err()
}

func (s *Store) scalarInt(ctx context.Context, query string, args ...any) (int64, error) {
	var n int64
	err := s.db.GetContext(ctx, &n, query, args...)
	return n, err
}

func (s *Store) scalarFloat(ctx context.Context, query string, args ...any) (float64, error) {
	var n float64
	err := s.db.GetContext(ctx, &n, query, args...)
	return n, err
}

func (s *Store) StoreStatusCounts(ctx context.Context) (map[string]int64, error) {
	return s.groupCount(ctx, `SELECT status, COUNT(*) FROM stores WHERE deleted_at IS NULL GROUP BY status`)
}

func (s *Store) StoreFeaturedCount(ctx context.Context) (int64, error) {
	return s.scalarInt(ctx, `SELECT COUNT(*) FROM stores WHERE is_featured = 1 AND deleted_at IS NULL`)
}

func (s *Store) SellerStatusCounts(ctx context.Context) (map[string]int64, error) {
	return s.groupCount(ctx, `SELECT status, COUNT(*) FROM users WHERE role = 'seller' AND deleted_at IS NULL GROUP BY status`)
}

func (s *Store) ProductStatusCounts(ctx context.Context) (map[string]int64, error) {
	return s.groupCount(ctx, `SELECT status, COUNT(*) FROM products WHERE deleted_at IS NULL GROUP BY status`)
}

func (s *Store) OrderStatusCounts(ctx context.Context) (map[string]int64, error) {
	return s.groupCount(ctx, `SELECT status, COUNT(*) FROM orders WHERE deleted_at IS NULL GROUP BY status`)
}

func (s *Store) Revenue(ctx context.Context) (gmv float64, paidOrders int64, err error) {
	row := s.db.QueryRowxContext(ctx,
		`SELECT COALESCE(SUM(total), 0), COUNT(*) FROM orders WHERE payment_status = 'paid' AND deleted_at IS NULL`)
	err = row.Scan(&gmv, &paidOrders)
	return
}

func (s *Store) NewStoresSince(ctx context.Context, since time.Time) (int64, error) {
	return s.scalarInt(ctx, `SELECT COUNT(*) FROM stores WHERE created_at >= ? AND deleted_at IS NULL`, since)
}

func (s *Store) NewOrdersSince(ctx context.Context, since time.Time) (int64, error) {
	return s.scalarInt(ctx, `SELECT COUNT(*) FROM orders WHERE created_at >= ? AND deleted_at IS NULL`, since)
}

func (s *Store) RevenueSince(ctx context.Context, since time.Time) (float64, error) {
	return s.scalarFloat(ctx,
		`SELECT COALESCE(SUM(total), 0) FROM orders WHERE payment_status = 'paid' AND paid_at >= ? AND deleted_at IS NULL`, since)
}

func (s *Store) TopStoresByRevenue(ctx context.Context, limit int) ([]StoreRevenue, error) {
	var rows []StoreRevenue
	err := s.db.SelectContext(ctx, &rows,
		`SELECT s.id, s.name, s.slug,
		        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total ELSE 0 END), 0) AS revenue
		 FROM stores s
		 LEFT JOIN orders o ON o.store_id = s.id AND o.deleted_at IS NULL
		 WHERE s.deleted_at IS NULL
		 GROUP BY s.id, s.name, s.slug
		 ORDER BY revenue DESC
		 LIMIT ?`, limit)
	return rows, err
}
