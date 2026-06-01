package httpapi

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"github.com/vendorex/admin-reports/internal/store"
)

func NewRouter(s *store.Store, logger *slog.Logger) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(observability(logger))

	r.Get("/health", healthHandler(s))
	r.Handle("/metrics", promhttp.Handler())

	r.Route("/api/admin-reports", func(r chi.Router) {
		r.Use(requireAdmin(s, logger))
		r.Get("/me", meHandler())
	})

	return r
}
