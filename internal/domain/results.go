// Best-option ranking (specs/results/spec.md): rank by fewest Unavailable, then
// most Preferred. Ties => every row matching the top (unavailable, preferred)
// pair is flagged best, leaving the final call to the organizer.
package domain

import "sort"

type Counts struct {
	Preferred   int
	Available   int
	Unavailable int
}

func (c Counts) total() int { return c.Preferred + c.Available + c.Unavailable }

// MarkBest sorts rows by the ranking rule and reports which are best. It returns
// the sorted order plus a parallel isBest slice; callers keep their own row type.
func MarkBest[T any](rows []T, counts func(T) Counts) ([]T, []bool) {
	out := make([]T, len(rows))
	copy(out, rows)
	sort.SliceStable(out, func(i, j int) bool {
		a, b := counts(out[i]), counts(out[j])
		if a.Unavailable != b.Unavailable {
			return a.Unavailable < b.Unavailable
		}
		return a.Preferred > b.Preferred
	})

	best := make([]bool, len(out))
	if len(out) == 0 {
		return out, best
	}
	// No highlight until at least one response exists - otherwise an all-zero
	// board ties every row on unavailable=0 and marks them all "best".
	anyAnswered := false
	for _, r := range out {
		if counts(r).total() > 0 {
			anyAnswered = true
			break
		}
	}
	top := counts(out[0])
	for i, r := range out {
		c := counts(r)
		best[i] = anyAnswered && c.Unavailable == top.Unavailable && c.Preferred == top.Preferred
	}
	return out, best
}
