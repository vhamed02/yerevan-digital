package config

import (
	"fmt"
	"os"
)

type Config struct {
	Env           string
	HTTPAddr      string
	DBHost        string
	DBPort        string
	DBDatabase    string
	DBUsername    string
	DBPassword    string
	AuthUserModel string
}

func Load() Config {
	return Config{
		Env:           env("APP_ENV", "production"),
		HTTPAddr:      env("ADMIN_REPORTS_ADDR", ":8090"),
		DBHost:        env("DB_HOST", "mysql"),
		DBPort:        env("DB_PORT", "3306"),
		DBDatabase:    env("DB_DATABASE", "vendora"),
		DBUsername:    env("ADMIN_REPORTS_DB_USERNAME", env("DB_USERNAME", "vendora")),
		DBPassword:    env("ADMIN_REPORTS_DB_PASSWORD", env("DB_PASSWORD", "")),
		AuthUserModel: env("AUTH_USER_MODEL", `App\Models\User`),
	}
}

func (c Config) DSN() string {
	return fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?parseTime=true&loc=UTC&timeout=5s&readTimeout=10s",
		c.DBUsername, c.DBPassword, c.DBHost, c.DBPort, c.DBDatabase,
	)
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
