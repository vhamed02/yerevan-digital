package store

import (
	"context"
	"crypto/subtle"
	"database/sql"
	"errors"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
)

var (
	ErrUnauthorized = errors.New("unauthorized")
	ErrForbidden    = errors.New("forbidden")
)

type Store struct {
	db            *sqlx.DB
	userModelType string
}

func Connect(dsn string) (*sqlx.DB, error) {
	db, err := sqlx.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(time.Hour)
	return db, nil
}

func New(db *sqlx.DB, userModelType string) *Store {
	return &Store{db: db, userModelType: userModelType}
}

func (s *Store) Ping(ctx context.Context) error {
	return s.db.PingContext(ctx)
}

type AdminUser struct {
	ID    int64  `db:"id"`
	Name  string `db:"name"`
	Email string `db:"email"`
}

func (s *Store) AuthenticateAdmin(ctx context.Context, tokenID, tokenHash string) (*AdminUser, error) {
	var token struct {
		TokenableID int64        `db:"tokenable_id"`
		Token       string       `db:"token"`
		ExpiresAt   sql.NullTime `db:"expires_at"`
	}

	err := s.db.GetContext(ctx, &token,
		`SELECT tokenable_id, token, expires_at FROM personal_access_tokens WHERE id = ?`, tokenID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrUnauthorized
	}
	if err != nil {
		return nil, err
	}

	if subtle.ConstantTimeCompare([]byte(token.Token), []byte(tokenHash)) != 1 {
		return nil, ErrUnauthorized
	}
	if token.ExpiresAt.Valid && token.ExpiresAt.Time.Before(time.Now()) {
		return nil, ErrUnauthorized
	}

	var adminRoles int
	err = s.db.GetContext(ctx, &adminRoles,
		`SELECT COUNT(*) FROM model_has_roles mhr
		 JOIN roles r ON r.id = mhr.role_id
		 WHERE mhr.model_id = ? AND mhr.model_type = ? AND r.name = 'admin'`,
		token.TokenableID, s.userModelType)
	if err != nil {
		return nil, err
	}
	if adminRoles == 0 {
		return nil, ErrForbidden
	}

	var user AdminUser
	err = s.db.GetContext(ctx, &user,
		`SELECT id, name, email FROM users WHERE id = ?`, token.TokenableID)
	if err != nil {
		return nil, err
	}

	return &user, nil
}
