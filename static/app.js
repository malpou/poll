// Client glue. HTMX owns everything that talks to the server; Alpine owns the
// in-page state that doesn't need a round-trip: preferences, the submit gate,
// the edit toggle, the live locale switch. State lives in the markup's x-data;
// the shared component definitions live here.

document.addEventListener('alpine:init', () => {
	// The response page (/r and /s). Seeded server-side with the stored answers,
	// so a revisit pre-selects what the invitee last chose.
	Alpine.data('responsePage', (seed) => ({
		answers: seed.answers || {},
		ids: seed.ids || [],
		name: seed.name || '',
		mode: seed.mode || 'assigned',
		submitted: !!seed.submitted,
		editUrl: seed.editUrl || '',

		// Submit stays disabled until every date is answered and, in open mode,
		// until a name is typed.
		allAnswered() {
			if (this.ids.length === 0) return false;
			if (this.mode === 'open' && this.name.trim() === '') return false;
			return this.ids.every((id) => !!this.answers[id]);
		},

		copy(url, copiedText) {
			navigator.clipboard.writeText(url).catch(() => undefined);
			this.$dispatch('poll-toast', copiedText);
		}
	}));

	// The create page: poll mode + add/remove rows. Rows carry indexed names
	// (dates.0.value), so every add/remove reindexes to keep the server's parser
	// lined up.
	Alpine.data('createPage', () => ({
		pollMode: 'assigned',

		init() {
			// The select is server-rendered with the current mode selected; adopt it
			// so a failed submit keeps the chosen mode.
			const sel = this.$el.querySelector('select[x-model="pollMode"]');
			if (sel) this.pollMode = sel.value;
		},

		reindex(list, prefix) {
			list.querySelectorAll('[data-row]').forEach((row, i) => {
				row.querySelectorAll('[data-field]').forEach((el) => {
					el.name = prefix + '.' + i + '.' + el.getAttribute('data-field');
				});
			});
		},

		addDate(list) {
			const first = list.querySelector('[data-row]');
			if (!first) return;
			const row = first.cloneNode(true);
			row.querySelectorAll('[data-field]').forEach((el) => (el.value = ''));
			list.appendChild(row);
			this.reindex(list, 'dates');
		},

		addPerson(list) {
			const first = list.querySelector('[data-row]');
			if (!first) return;
			const row = first.cloneNode(true);
			row.querySelectorAll('[data-field]').forEach((el) => {
				// A fresh participant needs its own token.
				el.value = el.getAttribute('data-field') === 'token' ? randomToken() : '';
			});
			list.appendChild(row);
			this.reindex(list, 'participants');
		},

		removeRow(btn, list, prefix) {
			const row = btn.closest('[data-row]');
			if (!row || list.querySelectorAll('[data-row]').length <= 1) return;
			row.remove();
			this.reindex(list, prefix);
		}
	}));

	// The dashboard: only the header's title/description/mode/language editor is
	// page-level state. Per-row edit and expand toggles own their own x-data.
	Alpine.data('dashboard', () => ({
		editingDetails: false,

		copy(url, copiedText) {
			navigator.clipboard.writeText(url).catch(() => undefined);
			this.$dispatch('poll-toast', copiedText);
		}
	}));

	// The copy-confirmation toast, shared by every page.
	Alpine.data('toast', () => ({
		text: '',
		timer: undefined,
		show(t) {
			this.text = t;
			clearTimeout(this.timer);
			this.timer = setTimeout(() => (this.text = ''), 3000);
		}
	}));
});

// >=128 bits of entropy, base62, matching the server's own token minting. A row
// added in the browser carries its token with it; the server regenerates any it
// doesn't receive.
function randomToken() {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const bytes = new Uint8Array(22);
	crypto.getRandomValues(bytes);
	let out = '';
	for (const b of bytes) out += chars[b % 62];
	return out;
}

// Confirm-before-submit for destructive dashboard actions: warn first, cancel
// cleanly on dismiss.
document.addEventListener('htmx:confirm', (e) => {
	const msg = e.detail.elt.getAttribute('data-confirm');
	if (!msg) return;
	e.preventDefault();
	if (confirm(msg)) e.detail.issueRequest(true);
});

// A rejected submit answers 400 with the re-rendered form. HTMX only swaps 2xx
// by default, so opt 4xx in; otherwise validation errors would silently never
// appear.
document.addEventListener('htmx:beforeSwap', (e) => {
	if (e.detail.xhr.status === 400 || e.detail.xhr.status === 403) {
		e.detail.shouldSwap = true;
		e.detail.isError = false;
	}
});
