package domain

import "crypto/rand"

const base62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

// NewToken mints a capability token: >=128 bits of entropy, base62
// (specs/PROJECT.md). 22 chars ~ 131 bits.
//
// The b % 62 fold biases the first 8 letters very slightly; at 131 bits that
// leaves far more entropy than the 128 the threat model asks for. Use
// rand.Int(len(base62)) if an exactly uniform alphabet is ever wanted.
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
