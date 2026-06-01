package httpapi

import (
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/vendorex/admin-reports/internal/paginate"
	"github.com/vendorex/admin-reports/internal/report"
	"github.com/vendorex/admin-reports/internal/store"
)

func overviewHandler(rep *report.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ov, err := rep.Overview(r.Context())
		respond(w, ov, err)
	}
}

func storesHandler(rep *report.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		f := store.StoreFilter{Search: query(r, "q"), Status: query(r, "status")}
		res, err := rep.ListStores(r.Context(), f, pageParams(r))
		respond(w, res, err)
	}
}

func sellersHandler(rep *report.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		f := store.SellerFilter{Search: query(r, "q"), Status: query(r, "status")}
		res, err := rep.ListSellers(r.Context(), f, pageParams(r))
		respond(w, res, err)
	}
}

func productsHandler(rep *report.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		f := store.ProductFilter{
			Search:  query(r, "q"),
			Status:  query(r, "status"),
			StoreID: queryInt64(r, "store_id"),
		}
		res, err := rep.ListProducts(r.Context(), f, pageParams(r))
		respond(w, res, err)
	}
}

func ordersHandler(rep *report.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		f := store.OrderFilter{
			Search:        query(r, "q"),
			Status:        query(r, "status"),
			PaymentStatus: query(r, "payment_status"),
			StoreID:       queryInt64(r, "store_id"),
			From:          queryTime(r, "from"),
			To:            queryTime(r, "to"),
		}
		res, err := rep.ListOrders(r.Context(), f, pageParams(r))
		respond(w, res, err)
	}
}

func respond(w http.ResponseWriter, body any, err error) {
	if err != nil {
		slog.Error("report query failed", "error", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, body)
}

func query(r *http.Request, key string) string {
	return r.URL.Query().Get(key)
}

func queryInt64(r *http.Request, key string) int64 {
	n, _ := strconv.ParseInt(r.URL.Query().Get(key), 10, 64)
	return n
}

func queryTime(r *http.Request, key string) *time.Time {
	v := r.URL.Query().Get(key)
	if v == "" {
		return nil
	}
	for _, layout := range []string{time.RFC3339, "2006-01-02"} {
		if t, err := time.Parse(layout, v); err == nil {
			return &t
		}
	}
	return nil
}

func pageParams(r *http.Request) paginate.Params {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	perPage, _ := strconv.Atoi(r.URL.Query().Get("per_page"))
	return paginate.Parse(page, perPage, 20, 100)
}
