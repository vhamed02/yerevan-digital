package store

import (
	"context"
	"database/sql"
)

type StoreHit struct {
	ID   int64  `db:"id"`
	UUID string `db:"uuid"`
	Name []byte `db:"name"`
	Slug string `db:"slug"`
}

func (s *Store) SearchStores(ctx context.Context, q string, limit int) ([]StoreHit, error) {
	var rows []StoreHit
	like := "%" + q + "%"
	err := s.db.SelectContext(ctx, &rows,
		`SELECT id, uuid, name, slug FROM stores
		 WHERE deleted_at IS NULL AND (name LIKE ? OR slug LIKE ?)
		 ORDER BY created_at DESC LIMIT ?`, like, like, limit)
	return rows, err
}

type ProductHit struct {
	ID        int64  `db:"id"`
	UUID      string `db:"uuid"`
	Name      []byte `db:"name"`
	StoreName []byte `db:"store_name"`
}

func (s *Store) SearchProducts(ctx context.Context, q string, limit int) ([]ProductHit, error) {
	var rows []ProductHit
	like := "%" + q + "%"
	err := s.db.SelectContext(ctx, &rows,
		`SELECT p.id, p.uuid, p.name, s.name AS store_name
		 FROM products p JOIN stores s ON s.id = p.store_id
		 WHERE p.deleted_at IS NULL AND (p.name LIKE ? OR p.sku LIKE ?)
		 ORDER BY p.created_at DESC LIMIT ?`, like, like, limit)
	return rows, err
}

type SellerHit struct {
	ID    int64  `db:"id"`
	UUID  string `db:"uuid"`
	Name  string `db:"name"`
	Email string `db:"email"`
}

func (s *Store) SearchSellers(ctx context.Context, q string, limit int) ([]SellerHit, error) {
	var rows []SellerHit
	like := "%" + q + "%"
	err := s.db.SelectContext(ctx, &rows,
		`SELECT id, uuid, name, email FROM users
		 WHERE role = 'seller' AND deleted_at IS NULL AND (name LIKE ? OR email LIKE ?)
		 ORDER BY created_at DESC LIMIT ?`, like, like, limit)
	return rows, err
}

type OrderHit struct {
	ID          int64          `db:"id"`
	UUID        string         `db:"uuid"`
	OrderNumber sql.NullString `db:"order_number"`
	Customer    string         `db:"customer_name"`
	StoreName   []byte         `db:"store_name"`
}

func (s *Store) SearchOrders(ctx context.Context, q string, limit int) ([]OrderHit, error) {
	var rows []OrderHit
	like := "%" + q + "%"
	err := s.db.SelectContext(ctx, &rows,
		`SELECT o.id, o.uuid, o.order_number, o.customer_name, s.name AS store_name
		 FROM orders o JOIN stores s ON s.id = o.store_id
		 WHERE o.deleted_at IS NULL AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ?)
		 ORDER BY o.created_at DESC LIMIT ?`, like, like, like, limit)
	return rows, err
}
