package store

import (
	"context"
	"database/sql"
	"strings"
	"time"
)

type StoreFilter struct {
	Search string
	Status string
}

type StoreListRow struct {
	ID         int64     `db:"id"`
	UUID       string    `db:"uuid"`
	Name       []byte    `db:"name"`
	Slug       string    `db:"slug"`
	Status     string    `db:"status"`
	IsFeatured int       `db:"is_featured"`
	Currency   string    `db:"currency"`
	OwnerName  string    `db:"owner_name"`
	OrderCount int64     `db:"order_count"`
	Revenue    float64   `db:"revenue"`
	CreatedAt  time.Time `db:"created_at"`
}

const storeSelect = `SELECT s.id, s.uuid, s.name, s.slug, s.status, s.is_featured, s.currency, u.name AS owner_name,
	(SELECT COUNT(*) FROM orders o WHERE o.store_id = s.id AND o.deleted_at IS NULL) AS order_count,
	(SELECT COALESCE(SUM(o.total), 0) FROM orders o WHERE o.store_id = s.id AND o.payment_status = 'paid' AND o.deleted_at IS NULL) AS revenue,
	s.created_at
	FROM stores s JOIN users u ON u.id = s.user_id`

func whereStores(f StoreFilter) (string, []any) {
	conds := []string{"s.deleted_at IS NULL"}
	var args []any
	if f.Status != "" {
		conds = append(conds, "s.status = ?")
		args = append(args, f.Status)
	}
	if f.Search != "" {
		conds = append(conds, "(s.name LIKE ? OR s.slug LIKE ?)")
		like := "%" + f.Search + "%"
		args = append(args, like, like)
	}
	return strings.Join(conds, " AND "), args
}

func (s *Store) ListStores(ctx context.Context, f StoreFilter, limit, offset int) ([]StoreListRow, int64, error) {
	where, args := whereStores(f)

	var total int64
	if err := s.db.GetContext(ctx, &total, "SELECT COUNT(*) FROM stores s WHERE "+where, args...); err != nil {
		return nil, 0, err
	}

	var rows []StoreListRow
	err := s.db.SelectContext(ctx, &rows, storeSelect+" WHERE "+where+" ORDER BY s.created_at DESC LIMIT ? OFFSET ?",
		append(append([]any{}, args...), limit, offset)...)
	return rows, total, err
}

func (s *Store) StreamStores(ctx context.Context, f StoreFilter, fn func(StoreListRow) error) error {
	where, args := whereStores(f)
	return stream(ctx, s, storeSelect+" WHERE "+where+" ORDER BY s.created_at DESC", args, fn)
}

type SellerFilter struct {
	Search string
	Status string
}

type SellerListRow struct {
	ID        int64          `db:"id"`
	UUID      string         `db:"uuid"`
	Name      string         `db:"name"`
	Email     string         `db:"email"`
	Phone     sql.NullString `db:"phone"`
	Status    string         `db:"status"`
	StoreID   sql.NullInt64  `db:"store_id"`
	StoreName []byte         `db:"store_name"`
	StoreSlug sql.NullString `db:"store_slug"`
	Revenue   float64        `db:"revenue"`
	LastLogin sql.NullTime   `db:"last_login_at"`
	CreatedAt time.Time      `db:"created_at"`
}

const sellerSelect = `SELECT u.id, u.uuid, u.name, u.email, u.phone, u.status,
	s.id AS store_id, s.name AS store_name, s.slug AS store_slug,
	(SELECT COALESCE(SUM(o.total), 0) FROM orders o
	   JOIN stores st ON st.id = o.store_id
	   WHERE st.user_id = u.id AND o.payment_status = 'paid' AND o.deleted_at IS NULL) AS revenue,
	u.last_login_at, u.created_at
	FROM users u LEFT JOIN stores s ON s.user_id = u.id AND s.deleted_at IS NULL`

func whereSellers(f SellerFilter) (string, []any) {
	conds := []string{"u.role = 'seller'", "u.deleted_at IS NULL"}
	var args []any
	if f.Status != "" {
		conds = append(conds, "u.status = ?")
		args = append(args, f.Status)
	}
	if f.Search != "" {
		conds = append(conds, "(u.name LIKE ? OR u.email LIKE ?)")
		like := "%" + f.Search + "%"
		args = append(args, like, like)
	}
	return strings.Join(conds, " AND "), args
}

func (s *Store) ListSellers(ctx context.Context, f SellerFilter, limit, offset int) ([]SellerListRow, int64, error) {
	where, args := whereSellers(f)

	var total int64
	if err := s.db.GetContext(ctx, &total, "SELECT COUNT(*) FROM users u WHERE "+where, args...); err != nil {
		return nil, 0, err
	}

	var rows []SellerListRow
	err := s.db.SelectContext(ctx, &rows, sellerSelect+" WHERE "+where+" ORDER BY u.created_at DESC LIMIT ? OFFSET ?",
		append(append([]any{}, args...), limit, offset)...)
	return rows, total, err
}

func (s *Store) StreamSellers(ctx context.Context, f SellerFilter, fn func(SellerListRow) error) error {
	where, args := whereSellers(f)
	return stream(ctx, s, sellerSelect+" WHERE "+where+" ORDER BY u.created_at DESC", args, fn)
}

type ProductFilter struct {
	Search  string
	Status  string
	StoreID int64
}

type ProductListRow struct {
	ID           int64          `db:"id"`
	UUID         string         `db:"uuid"`
	Name         []byte         `db:"name"`
	Slug         string         `db:"slug"`
	Status       string         `db:"status"`
	SKU          sql.NullString `db:"sku"`
	Price        float64        `db:"price"`
	Stock        int64          `db:"stock"`
	ViewCount    int64          `db:"view_count"`
	IsFeatured   int            `db:"is_featured"`
	StoreID      int64          `db:"store_id"`
	StoreName    []byte         `db:"store_name"`
	CategoryName []byte         `db:"category_name"`
	CreatedAt    time.Time      `db:"created_at"`
}

const productSelect = `SELECT p.id, p.uuid, p.name, p.slug, p.status, p.sku, p.price, p.stock, p.view_count, p.is_featured,
	p.store_id, s.name AS store_name, c.name AS category_name, p.created_at
	FROM products p JOIN stores s ON s.id = p.store_id LEFT JOIN categories c ON c.id = p.category_id`

func whereProducts(f ProductFilter) (string, []any) {
	conds := []string{"p.deleted_at IS NULL"}
	var args []any
	if f.Status != "" {
		conds = append(conds, "p.status = ?")
		args = append(args, f.Status)
	}
	if f.StoreID > 0 {
		conds = append(conds, "p.store_id = ?")
		args = append(args, f.StoreID)
	}
	if f.Search != "" {
		conds = append(conds, "(p.name LIKE ? OR p.sku LIKE ?)")
		like := "%" + f.Search + "%"
		args = append(args, like, like)
	}
	return strings.Join(conds, " AND "), args
}

func (s *Store) ListProducts(ctx context.Context, f ProductFilter, limit, offset int) ([]ProductListRow, int64, error) {
	where, args := whereProducts(f)

	var total int64
	if err := s.db.GetContext(ctx, &total, "SELECT COUNT(*) FROM products p WHERE "+where, args...); err != nil {
		return nil, 0, err
	}

	var rows []ProductListRow
	err := s.db.SelectContext(ctx, &rows, productSelect+" WHERE "+where+" ORDER BY p.created_at DESC LIMIT ? OFFSET ?",
		append(append([]any{}, args...), limit, offset)...)
	return rows, total, err
}

func (s *Store) StreamProducts(ctx context.Context, f ProductFilter, fn func(ProductListRow) error) error {
	where, args := whereProducts(f)
	return stream(ctx, s, productSelect+" WHERE "+where+" ORDER BY p.created_at DESC", args, fn)
}

type OrderFilter struct {
	Search        string
	Status        string
	PaymentStatus string
	StoreID       int64
	From          *time.Time
	To            *time.Time
}

type OrderListRow struct {
	ID            int64          `db:"id"`
	UUID          string         `db:"uuid"`
	OrderNumber   sql.NullString `db:"order_number"`
	Status        string         `db:"status"`
	PaymentStatus string         `db:"payment_status"`
	PaymentMethod sql.NullString `db:"payment_method"`
	Total         float64        `db:"total"`
	Currency      string         `db:"currency"`
	CustomerName  string         `db:"customer_name"`
	CustomerEmail string         `db:"customer_email"`
	StoreID       int64          `db:"store_id"`
	StoreName     []byte         `db:"store_name"`
	CreatedAt     time.Time      `db:"created_at"`
	PaidAt        sql.NullTime   `db:"paid_at"`
}

const orderSelect = `SELECT o.id, o.uuid, o.order_number, o.status, o.payment_status, o.payment_method,
	o.total, o.currency, o.customer_name, o.customer_email,
	o.store_id, s.name AS store_name, o.created_at, o.paid_at
	FROM orders o JOIN stores s ON s.id = o.store_id`

func whereOrders(f OrderFilter) (string, []any) {
	conds := []string{"o.deleted_at IS NULL"}
	var args []any
	if f.Status != "" {
		conds = append(conds, "o.status = ?")
		args = append(args, f.Status)
	}
	if f.PaymentStatus != "" {
		conds = append(conds, "o.payment_status = ?")
		args = append(args, f.PaymentStatus)
	}
	if f.StoreID > 0 {
		conds = append(conds, "o.store_id = ?")
		args = append(args, f.StoreID)
	}
	if f.From != nil {
		conds = append(conds, "o.created_at >= ?")
		args = append(args, *f.From)
	}
	if f.To != nil {
		conds = append(conds, "o.created_at <= ?")
		args = append(args, *f.To)
	}
	if f.Search != "" {
		conds = append(conds, "(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ?)")
		like := "%" + f.Search + "%"
		args = append(args, like, like, like)
	}
	return strings.Join(conds, " AND "), args
}

func (s *Store) ListOrders(ctx context.Context, f OrderFilter, limit, offset int) ([]OrderListRow, int64, error) {
	where, args := whereOrders(f)

	var total int64
	if err := s.db.GetContext(ctx, &total, "SELECT COUNT(*) FROM orders o WHERE "+where, args...); err != nil {
		return nil, 0, err
	}

	var rows []OrderListRow
	err := s.db.SelectContext(ctx, &rows, orderSelect+" WHERE "+where+" ORDER BY o.created_at DESC LIMIT ? OFFSET ?",
		append(append([]any{}, args...), limit, offset)...)
	return rows, total, err
}

func (s *Store) StreamOrders(ctx context.Context, f OrderFilter, fn func(OrderListRow) error) error {
	where, args := whereOrders(f)
	return stream(ctx, s, orderSelect+" WHERE "+where+" ORDER BY o.created_at DESC", args, fn)
}

func stream[T any](ctx context.Context, s *Store, query string, args []any, fn func(T) error) error {
	rows, err := s.db.QueryxContext(ctx, query, args...)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var row T
		if err := rows.StructScan(&row); err != nil {
			return err
		}
		if err := fn(row); err != nil {
			return err
		}
	}
	return rows.Err()
}
