package domain

import "crypto/rand"

const base62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

// NewToken mints a capability token: >=128 bits of entropy, base62
// (specs/PROJECT.md). 22 chars ~ 131 bits. Ported from src/lib/data/shared.ts,
// which used crypto.getRandomValues with the same b % 62 mapping.
//
// ponytail: b % 62 over 256 byte values is very slightly biased toward the first
// 8 letters, exactly as the original was. Kept for parity; swap to
// rand.Int(len(base62)) if the bias ever matters.
func NewToken() string {
	b := make([]byte, 22)
	if _, err := rand.Read(b); err != nil {
		panic("tokens: no entropy: " + err.Error())
	}
	out := make([]byte, len(b))
	for i, x := range b {
		out[i] = base62[int(x)%62]
	}
	return string(out)
}

// ID mints a prefixed row id, e.g. "event-Xk3p9Qa".
func ID(prefix string) string { return prefix + "-" + NewToken()[:7] }
