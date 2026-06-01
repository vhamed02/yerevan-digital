package httpapi

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"

	"github.com/vendorex/admin-reports/internal/auth"
	"github.com/vendorex/admin-reports/internal/store"
)

type userCtxKey struct{}

var httpDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
	Name:    "admin_reports_http_request_duration_seconds",
	Help:    "Duration of HTTP requests in seconds.",
	Buckets: prometheus.DefBuckets,
}, []string{"method", "route", "status"})

func observability(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)

			next.ServeHTTP(ww, r)

			route := chi.RouteContext(r.Context()).RoutePattern()
			if route == "" {
				route = r.URL.Path
			}
			elapsed := time.Since(start)

			httpDuration.WithLabelValues(r.Method, route, strconv.Itoa(ww.Status())).Observe(elapsed.Seconds())
			logger.Info("request",
				"method", r.Method,
				"route", route,
				"status", ww.Status(),
				"duration_ms", elapsed.Milliseconds(),
				"request_id", middleware.GetReqID(r.Context()),
			)
		})
	}
}

func requireAdmin(s *store.Store, logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			id, plaintext, ok := auth.ParseBearer(r.Header.Get("Authorization"))
			if !ok {
				writeError(w, http.StatusUnauthorized, "missing or malformed bearer token")
				return
			}

			user, err := s.AuthenticateAdmin(r.Context(), id, auth.HashToken(plaintext))
			switch {
			case errors.Is(err, store.ErrUnauthorized):
				writeError(w, http.StatusUnauthorized, "invalid token")
			case errors.Is(err, store.ErrForbidden):
				writeError(w, http.StatusForbidden, "admin role required")
			case err != nil:
				logger.Error("authentication failed", "error", err)
				writeError(w, http.StatusInternalServerError, "internal error")
			default:
				next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), userCtxKey{}, user)))
			}
		})
	}
}

func adminFromContext(ctx context.Context) *store.AdminUser {
	user, _ := ctx.Value(userCtxKey{}).(*store.AdminUser)
	return user
}
