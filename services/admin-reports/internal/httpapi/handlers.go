package httpapi

import (
	"context"
	"net/http"
	"time"

	"github.com/yerevan-digital/admin-reports/internal/store"
)

func healthHandler(s *store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()

		dbStatus := "ok"
		status := http.StatusOK
		if err := s.Ping(ctx); err != nil {
			dbStatus = "down"
			status = http.StatusServiceUnavailable
		}

		writeJSON(w, status, map[string]any{
			"service": "ok",
			"db":      dbStatus,
			"time":    time.Now().UTC().Format(time.RFC3339),
		})
	}
}

func meHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := adminFromContext(r.Context())
		writeJSON(w, http.StatusOK, map[string]any{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
		})
	}
}
