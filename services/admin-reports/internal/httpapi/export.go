package httpapi

import (
	"encoding/csv"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/yerevan-digital/admin-reports/internal/report"
	"github.com/yerevan-digital/admin-reports/internal/store"
)

func exportHandler(rep *report.Service) http.HandlerFunc {
	valid := map[string]bool{"stores": true, "sellers": true, "products": true, "orders": true}

	return func(w http.ResponseWriter, r *http.Request) {
		entity := chi.URLParam(r, "entity")
		if !valid[entity] {
			writeError(w, http.StatusNotFound, "unknown export entity")
			return
		}

		filename := entity + "-" + time.Now().UTC().Format("2006-01-02") + ".csv"
		w.Header().Set("Content-Type", "text/csv; charset=utf-8")
		w.Header().Set("Content-Disposition", `attachment; filename="`+filename+`"`)
		_, _ = w.Write([]byte{0xEF, 0xBB, 0xBF})

		flusher, _ := w.(http.Flusher)
		cw := csv.NewWriter(w)
		count := 0
		write := func(record []string) error {
			if err := cw.Write(record); err != nil {
				return err
			}
			count++
			if count%500 == 0 {
				cw.Flush()
				if err := cw.Error(); err != nil {
					return err
				}
				if flusher != nil {
					flusher.Flush()
				}
			}
			return nil
		}

		var err error
		switch entity {
		case "stores":
			err = rep.ExportStores(r.Context(), store.StoreFilter{Search: query(r, "q"), Status: query(r, "status")}, write)
		case "sellers":
			err = rep.ExportSellers(r.Context(), store.SellerFilter{Search: query(r, "q"), Status: query(r, "status")}, write)
		case "products":
			err = rep.ExportProducts(r.Context(), store.ProductFilter{
				Search: query(r, "q"), Status: query(r, "status"), StoreID: queryInt64(r, "store_id"),
			}, write)
		case "orders":
			err = rep.ExportOrders(r.Context(), store.OrderFilter{
				Search: query(r, "q"), Status: query(r, "status"), PaymentStatus: query(r, "payment_status"),
				StoreID: queryInt64(r, "store_id"), From: queryTime(r, "from"), To: queryTime(r, "to"),
			}, write)
		}

		cw.Flush()
		if flusher != nil {
			flusher.Flush()
		}
		if err != nil {
			slog.Error("export stream failed", "entity", entity, "error", err)
		}
	}
}
