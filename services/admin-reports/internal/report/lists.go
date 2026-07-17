package report

import (
	"context"
	"database/sql"
	"time"

	"github.com/yerevan-digital/admin-reports/internal/multilang"
	"github.com/yerevan-digital/admin-reports/internal/paginate"
	"github.com/yerevan-digital/admin-reports/internal/store"
)

type Page[T any] struct {
	Data []T           `json:"data"`
	Meta paginate.Meta `json:"meta"`
}

type StoreDTO struct {
	ID        int64     `json:"id"`
	UUID      string    `json:"uuid"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	Status    string    `json:"status"`
	Featured  bool      `json:"featured"`
	Currency  string    `json:"currency"`
	Owner     string    `json:"owner"`
	Orders    int64     `json:"orders"`
	Revenue   float64   `json:"revenue"`
	CreatedAt time.Time `json:"created_at"`
}

func (svc *Service) ListStores(ctx context.Context, f store.StoreFilter, p paginate.Params) (Page[StoreDTO], error) {
	rows, total, err := svc.s.ListStores(ctx, f, p.PerPage, p.Offset())
	if err != nil {
		return Page[StoreDTO]{}, err
	}
	data := make([]StoreDTO, 0, len(rows))
	for _, r := range rows {
		data = append(data, StoreDTO{
			ID: r.ID, UUID: r.UUID, Name: multilang.Pick(r.Name), Slug: r.Slug,
			Status: r.Status, Featured: r.IsFeatured == 1, Currency: r.Currency,
			Owner: r.OwnerName, Orders: r.OrderCount, Revenue: r.Revenue, CreatedAt: r.CreatedAt,
		})
	}
	return Page[StoreDTO]{Data: data, Meta: p.Meta(total)}, nil
}

type SellerStoreDTO struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type SellerDTO struct {
	ID        int64           `json:"id"`
	UUID      string          `json:"uuid"`
	Name      string          `json:"name"`
	Email     string          `json:"email"`
	Phone     string          `json:"phone"`
	Status    string          `json:"status"`
	Store     *SellerStoreDTO `json:"store"`
	Revenue   float64         `json:"revenue"`
	LastLogin *time.Time      `json:"last_login_at"`
	CreatedAt time.Time       `json:"created_at"`
}

func (svc *Service) ListSellers(ctx context.Context, f store.SellerFilter, p paginate.Params) (Page[SellerDTO], error) {
	rows, total, err := svc.s.ListSellers(ctx, f, p.PerPage, p.Offset())
	if err != nil {
		return Page[SellerDTO]{}, err
	}
	data := make([]SellerDTO, 0, len(rows))
	for _, r := range rows {
		dto := SellerDTO{
			ID: r.ID, UUID: r.UUID, Name: r.Name, Email: r.Email,
			Phone: nullString(r.Phone), Status: r.Status, Revenue: r.Revenue,
			LastLogin: nullTime(r.LastLogin), CreatedAt: r.CreatedAt,
		}
		if r.StoreID.Valid {
			dto.Store = &SellerStoreDTO{ID: r.StoreID.Int64, Name: multilang.Pick(r.StoreName), Slug: nullString(r.StoreSlug)}
		}
		data = append(data, dto)
	}
	return Page[SellerDTO]{Data: data, Meta: p.Meta(total)}, nil
}

type ProductDTO struct {
	ID        int64     `json:"id"`
	UUID      string    `json:"uuid"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	Status    string    `json:"status"`
	SKU       string    `json:"sku"`
	Price     float64   `json:"price"`
	Stock     int64     `json:"stock"`
	ViewCount int64     `json:"view_count"`
	Featured  bool      `json:"featured"`
	Store     SellerStoreDTO `json:"store"`
	Category  string    `json:"category"`
	CreatedAt time.Time `json:"created_at"`
}

func (svc *Service) ListProducts(ctx context.Context, f store.ProductFilter, p paginate.Params) (Page[ProductDTO], error) {
	rows, total, err := svc.s.ListProducts(ctx, f, p.PerPage, p.Offset())
	if err != nil {
		return Page[ProductDTO]{}, err
	}
	data := make([]ProductDTO, 0, len(rows))
	for _, r := range rows {
		data = append(data, ProductDTO{
			ID: r.ID, UUID: r.UUID, Name: multilang.Pick(r.Name), Slug: r.Slug, Status: r.Status,
			SKU: nullString(r.SKU), Price: r.Price, Stock: r.Stock, ViewCount: r.ViewCount,
			Featured: r.IsFeatured == 1,
			Store:    SellerStoreDTO{ID: r.StoreID, Name: multilang.Pick(r.StoreName)},
			Category: multilang.Pick(r.CategoryName), CreatedAt: r.CreatedAt,
		})
	}
	return Page[ProductDTO]{Data: data, Meta: p.Meta(total)}, nil
}

type OrderDTO struct {
	ID            int64          `json:"id"`
	UUID          string         `json:"uuid"`
	OrderNumber   string         `json:"order_number"`
	Status        string         `json:"status"`
	PaymentStatus string         `json:"payment_status"`
	PaymentMethod string         `json:"payment_method"`
	Total         float64        `json:"total"`
	Currency      string         `json:"currency"`
	Customer      OrderCustomer  `json:"customer"`
	Store         SellerStoreDTO `json:"store"`
	CreatedAt     time.Time      `json:"created_at"`
	PaidAt        *time.Time     `json:"paid_at"`
}

type OrderCustomer struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

func (svc *Service) ListOrders(ctx context.Context, f store.OrderFilter, p paginate.Params) (Page[OrderDTO], error) {
	rows, total, err := svc.s.ListOrders(ctx, f, p.PerPage, p.Offset())
	if err != nil {
		return Page[OrderDTO]{}, err
	}
	data := make([]OrderDTO, 0, len(rows))
	for _, r := range rows {
		data = append(data, OrderDTO{
			ID: r.ID, UUID: r.UUID, OrderNumber: nullString(r.OrderNumber),
			Status: r.Status, PaymentStatus: r.PaymentStatus, PaymentMethod: nullString(r.PaymentMethod),
			Total: r.Total, Currency: r.Currency,
			Customer: OrderCustomer{Name: r.CustomerName, Email: r.CustomerEmail},
			Store:    SellerStoreDTO{ID: r.StoreID, Name: multilang.Pick(r.StoreName)},
			CreatedAt: r.CreatedAt, PaidAt: nullTime(r.PaidAt),
		})
	}
	return Page[OrderDTO]{Data: data, Meta: p.Meta(total)}, nil
}

func nullString(v sql.NullString) string {
	if v.Valid {
		return v.String
	}
	return ""
}

func nullTime(v sql.NullTime) *time.Time {
	if v.Valid {
		return &v.Time
	}
	return nil
}
