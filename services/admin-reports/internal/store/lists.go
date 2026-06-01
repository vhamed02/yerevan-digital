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

func (s *Store) ListStores(ctx context.Context, f StoreFilter, limit, offset int) ([]StoreListRow, int64, error) {
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
	where := strings.Join(conds, " AND ")

	var total int64
	if err := s.db.GetContext(ctx, &total, "SELECT COUNT(*) FROM stores s WHERE "+where, args...); err != nil {
		return nil, 0, err
	}

	q := `SELECT s.id, s.uuid, s.name, s.slug, s.status, s.is_featured, s.currency, u.name AS owner_name,
	             (SELECT COUNT(*) FROM orders o WHERE o.store_id = s.id AND o.deleted_at IS NULL) AS order_count,
	             (SELECT COALESCE(SUM(o.total), 0) FROM orders o WHERE o.store_id = s.id AND o.payment_status = 'paid' AND o.deleted_at IS NULL) AS revenue,
	             s.created_at
	      FROM stores s JOIN users u ON u.id = s.user_id
	      WHERE ` + where + ` ORDER BY s.created_at DESC LIMIT ? OFFSET ?`

	var rows []StoreListRow
	err := s.db.SelectContext(ctx, &rows, q, append(append([]any{}, args...), limit, offset)...)
	return rows, total, err
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

func (s *Store) ListSellers(ctx context.Context, f SellerFilter, limit, offset int) ([]SellerListRow, int64, error) {
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
	where := strings.Join(conds, " AND ")

	var total int64
	if err := s.db.GetContext(ctx, &total, "SELECT COUNT(*) FROM users u WHERE "+where, args...); err != nil {
		return nil, 0, err
	}

	q := `SELECT u.id, u.uuid, u.name, u.email, u.phone, u.status,
	             s.id AS store_id, s.name AS store_name, s.slug AS store_slug,
	             (SELECT COALESCE(SUM(o.total), 0) FROM orders o
	                JOIN stores st ON st.id = o.store_id
	                WHERE st.user_id = u.id AND o.payment_status = 'paid' AND o.deleted_at IS NULL) AS revenue,
	             u.last_login_at, u.created_at
	      FROM users u
	      LEFT JOIN stores s ON s.user_id = u.id AND s.deleted_at IS NULL
	      WHERE ` + where + ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`

	var rows []SellerListRow
	err := s.db.SelectContext(ctx, &rows, q, append(append([]any{}, args...), limit, offset)...)
	return rows, total, err
}

type ProductFilter struct {
	Search  string
	Status  string
	StoreID int64
}

type ProductListRow struct {
	ID           int64     `db:"id"`
	UUID         string    `db:"uuid"`
	Name         []byte    `db:"name"`
	Slug         string    `db:"slug"`
	Status       string    `db:"status"`
	SKU          sql.NullString `db:"sku"`
	Price        float64   `db:"price"`
	Stock        int64     `db:"stock"`
	ViewCount    int64     `db:"view_count"`
	IsFeatured   int       `db:"is_featured"`
	StoreID      int64     `db:"store_id"`
	StoreName    []byte    `db:"store_name"`
	CategoryName []byte    `db:"category_name"`
	CreatedAt    time.Time `db:"created_at"`
}

func (s *Store) ListProducts(ctx context.Context, f ProductFilter, limit, offset int) ([]ProductListRow, int64, error) {
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
	where := strings.Join(conds, " AND ")

	var total int64
	if err := s.db.GetContext(ctx, &total, "SELECT COUNT(*) FROM products p WHERE "+where, args...); err != nil {
		return nil, 0, err
	}

	q := `SELECT p.id, p.uuid, p.name, p.slug, p.status, p.sku, p.price, p.stock, p.view_count, p.is_featured,
	             p.store_id, s.name AS store_name, c.name AS category_name, p.created_at
	      FROM products p
	      JOIN stores s ON s.id = p.store_id
	      LEFT JOIN categories c ON c.id = p.category_id
	      WHERE ` + where + ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`

	var rows []ProductListRow
	err := s.db.SelectContext(ctx, &rows, q, append(append([]any{}, args...), limit, offset)...)
	return rows, total, err
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

func (s *Store) ListOrders(ctx context.Context, f OrderFilter, limit, offset int) ([]OrderListRow, int64, error) {
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
	where := strings.Join(conds, " AND ")

	var total int64
	if err := s.db.GetContext(ctx, &total, "SELECT COUNT(*) FROM orders o WHERE "+where, args...); err != nil {
		return nil, 0, err
	}

	q := `SELECT o.id, o.uuid, o.order_number, o.status, o.payment_status, o.payment_method,
	             o.total, o.currency, o.customer_name, o.customer_email,
	             o.store_id, s.name AS store_name, o.created_at, o.paid_at
	      FROM orders o JOIN stores s ON s.id = o.store_id
	      WHERE ` + where + ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`

	var rows []OrderListRow
	err := s.db.SelectContext(ctx, &rows, q, append(append([]any{}, args...), limit, offset)...)
	return rows, total, err
}
