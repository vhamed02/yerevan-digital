package auth

import (
	"crypto/sha256"
	"encoding/hex"
	"strings"
)

func ParseBearer(header string) (id string, plaintext string, ok bool) {
	const prefix = "Bearer "
	if len(header) <= len(prefix) || !strings.EqualFold(header[:len(prefix)], prefix) {
		return "", "", false
	}

	parts := strings.SplitN(strings.TrimSpace(header[len(prefix):]), "|", 2)
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return "", "", false
	}

	return parts[0], parts[1], true
}

func HashToken(plaintext string) string {
	sum := sha256.Sum256([]byte(plaintext))
	return hex.EncodeToString(sum[:])
}
