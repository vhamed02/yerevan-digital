package report

import (
	"context"
	"database/sql"
	"strconv"
	"time"

	"github.com/yerevan-digital/admin-reports/internal/multilang"
	"github.com/yerevan-digital/admin-reports/internal/store"
)

type RecordWriter func(record []string) error

func (svc *Service) ExportStores(ctx context.Context, f store.StoreFilter, write RecordWriter) error {
	if err := write([]string{"id", "uuid", "name", "slug", "status", "featured", "currency", "owner", "orders", "revenue", "created_at"}); err != nil {
		return err
	}
	return svc.s.StreamStores(ctx, f, func(r store.StoreListRow) error {
		return write([]string{
			itoa(r.ID), r.UUID, multilang.Pick(r.Name), r.Slug, r.Status, yesno(r.IsFeatured == 1),
			r.Currency, r.OwnerName, itoa(r.OrderCount), ftoa(r.Revenue), ts(r.CreatedAt),
		})
	})
}

func (svc *Service) ExportSellers(ctx context.Context, f store.SellerFilter, write RecordWriter) error {
	if err := write([]string{"id", "uuid", "name", "email", "phone", "status", "store_name", "store_slug", "revenue", "last_login_at", "created_at"}); err != nil {
		return err
	}
	return svc.s.StreamSellers(ctx, f, func(r store.SellerListRow) error {
		storeName, storeSlug := "", ""
		if r.StoreID.Valid {
			storeName = multilang.Pick(r.StoreName)
			storeSlug = r.StoreSlug.String
		}
		return write([]string{
			itoa(r.ID), r.UUID, r.Name, r.Email, r.Phone.String, r.Status,
			storeName, storeSlug, ftoa(r.Revenue), tsNull(r.LastLogin), ts(r.CreatedAt),
		})
	})
}

func (svc *Service) ExportProducts(ctx context.Context, f store.ProductFilter, write RecordWriter) error {
	if err := write([]string{"id", "uuid", "name", "slug", "status", "sku", "price", "stock", "view_count", "featured", "store", "category", "created_at"}); err != nil {
		return err
	}
	return svc.s.StreamProducts(ctx, f, func(r store.ProductListRow) error {
		return write([]string{
			itoa(r.ID), r.UUID, multilang.Pick(r.Name), r.Slug, r.Status, r.SKU.String,
			ftoa(r.Price), itoa(r.Stock), itoa(r.ViewCount), yesno(r.IsFeatured == 1),
			multilang.Pick(r.StoreName), multilang.Pick(r.CategoryName), ts(r.CreatedAt),
		})
	})
}

func (svc *Service) ExportOrders(ctx context.Context, f store.OrderFilter, write RecordWriter) error {
	if err := write([]string{"id", "uuid", "order_number", "status", "payment_status", "payment_method", "total", "currency", "customer_name", "customer_email", "store", "created_at", "paid_at"}); err != nil {
		return err
	}
	return svc.s.StreamOrders(ctx, f, func(r store.OrderListRow) error {
		return write([]string{
			itoa(r.ID), r.UUID, r.OrderNumber.String, r.Status, r.PaymentStatus, r.PaymentMethod.String,
			ftoa(r.Total), r.Currency, r.CustomerName, r.CustomerEmail,
			multilang.Pick(r.StoreName), ts(r.CreatedAt), tsNull(r.PaidAt),
		})
	})
}

func itoa(n int64) string { return strconv.FormatInt(n, 10) }

func ftoa(f float64) string { return strconv.FormatFloat(f, 'f', 2, 64) }

func yesno(b bool) string {
	if b {
		return "yes"
	}
	return "no"
}

func ts(t time.Time) string { return t.UTC().Format(time.RFC3339) }

func tsNull(t sql.NullTime) string {
	if t.Valid {
		return t.Time.UTC().Format(time.RFC3339)
	}
	return ""
}
