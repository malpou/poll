package domain

import "testing"

// The three cases the dashboard's results view has to get right: a clear winner,
// a tie, and a board with no responses at all.
func TestMarkBest(t *testing.T) {
	type row struct {
		id string
		c  Counts
	}
	get := func(r row) Counts { return r.c }

	bestIDs := func(rows []row) []string {
		sorted, best := MarkBest(rows, get)
		var out []string
		for i, r := range sorted {
			if best[i] {
				out = append(out, r.id)
			}
		}
		return out
	}

	clear := []row{
		{"a", Counts{Preferred: 3, Unavailable: 2}},
		{"b", Counts{Preferred: 2}}, // fewest unavailable => best
		{"c", Counts{Preferred: 1}},
	}
	if got := bestIDs(clear); len(got) != 1 || got[0] != "b" {
		t.Errorf("clear winner: got %v want [b]", got)
	}

	tie := []row{
		{"a", Counts{Preferred: 2, Unavailable: 1}},
		{"b", Counts{Preferred: 2, Unavailable: 1}}, // ties a => both best
		{"c", Counts{Preferred: 5, Unavailable: 3}},
	}
	if got := bestIDs(tie); len(got) != 2 {
		t.Errorf("tie: got %v want 2 best", got)
	}

	none := []row{{"a", Counts{}}, {"b", Counts{}}}
	if got := bestIDs(none); len(got) != 0 {
		t.Errorf("no responses => no highlight, got %v", got)
	}

	if _, best := MarkBest([]row{}, get); len(best) != 0 {
		t.Error("empty list, no highlight")
	}
}
