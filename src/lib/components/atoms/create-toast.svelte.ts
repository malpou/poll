/**
 * Shared auto-dismiss state for the Toast atom: `const toast = createToast()`,
 * `toast.show(text)`, render `<Toast open={toast.open} text={toast.text} />`.
 */
export function createToast(duration = 3000) {
	let open = $state(false);
	let text = $state('');
	let timer: ReturnType<typeof setTimeout> | undefined;
	return {
		get open() {
			return open;
		},
		get text() {
			return text;
		},
		show(t: string) {
			text = t;
			clearTimeout(timer);
			open = true;
			timer = setTimeout(() => (open = false), duration);
		}
	};
}
