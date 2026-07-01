// Mirrors the D1 model in specs/PROJECT.md. starts_at/ends_at optional;
// ends_at requires starts_at. On the create form we hold date + times as
// separate fields and compose starts_at/ends_at at submit.

export type DateOption = {
	id: string;
	value: string; // yyyy-mm-dd, native <input type=date>
	startTime: string; // hh:mm or '' — optional
	endTime: string; // hh:mm or '' — optional, requires startTime
};

export type Participant = {
	id: string;
	name: string;
	token: string;
};

export type EventDraft = {
	title: string;
	description: string;
	dates: DateOption[];
	participants: Participant[];
};
