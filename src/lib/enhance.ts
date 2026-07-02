// Shared use:enhance factories for the dashboard's many small POST forms.
// Every form re-runs the load on success so the page reflects the change.

type AfterSubmit = (a: { result: { type: string }; update: () => Promise<void> }) => Promise<void>;

// enhance factory: re-run load on success, plus an optional local-state reset
// (close an inline edit, leave selection mode, ...).
export function refreshThen(onSuccess?: () => void) {
	return (): AfterSubmit =>
		({ result, update }) => {
			if (result.type === 'success') onSuccess?.();
			return update();
		};
}

// enhance factory: warn first when deleting something with responses. cancel()
// aborts the submit cleanly - done in the SubmitFunction (not onsubmit) so it
// cooperates with enhance's own preventDefault.
export function confirmingRefresh(message: string, needsConfirm: boolean, onSuccess?: () => void) {
	return ({ cancel }: { cancel: () => void }): AfterSubmit | undefined => {
		if (needsConfirm && !confirm(message)) {
			cancel();
			return undefined;
		}
		return ({ result, update }) => {
			if (result.type === 'success') onSuccess?.();
			return update();
		};
	};
}
