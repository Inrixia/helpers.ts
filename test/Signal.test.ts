import { describe, expect, it } from "vitest";
import { Signal } from "../src/class/Signal.js";

describe("Signal", () => {
	it("notifies subscribers with the next and previous value", () => {
		const signal = new Signal(1);
		const seen: Array<[number, number | undefined]> = [];
		signal.onValue((next, previous) => seen.push([next, previous]), { immediate: false });

		signal._ = 2;
		expect(seen).toEqual([[2, 1]]);
	});

	it("reads the current value", () => {
		expect(new Signal(5)._).toBe(5);
	});

	it("does not notify when set to the value it already holds", () => {
		const signal = new Signal(1);
		let calls = 0;
		signal.onValue(() => calls++, { immediate: false });

		signal._ = 1;
		expect(calls).toBe(0);
	});

	// The immediate call used to pass (value, value), which reads as a change
	// from the value to itself. There is no previous value on subscribe.
	describe("subscribe time behaviour", () => {
		it("calls the subscriber immediately by default", () => {
			const signal = new Signal(1);
			const seen: Array<[number, number | undefined]> = [];
			signal.onValue((next, previous) => seen.push([next, previous]));
			expect(seen).toEqual([[1, undefined]]);
		});

		it("can opt out of the immediate call", () => {
			const signal = new Signal(1);
			let calls = 0;
			signal.onValue(() => calls++, { immediate: false });
			expect(calls).toBe(0);
		});
	});

	it("stops notifying once unsubscribed", () => {
		const signal = new Signal(0);
		let calls = 0;
		const off = signal.onValue(() => calls++, { immediate: false });
		off();
		signal._ = 1;
		expect(calls).toBe(0);
	});

	it("supports a reentrant set from inside an observer", () => {
		const signal = new Signal(0);
		const seen: number[] = [];
		signal.onValue(
			(next) => {
				seen.push(next);
				if (next === 1) signal._ = 2;
			},
			{ immediate: false }
		);

		signal._ = 1;
		expect(seen).toEqual([1, 2]);
	});

	// A throwing observer used to abort the notification loop, so every
	// observer registered after it silently stopped receiving updates.
	describe("observer errors", () => {
		it("keeps notifying the remaining observers", () => {
			const signal = new Signal(0);
			const seen: number[] = [];
			signal.onValue(
				() => {
					throw new Error("observer boom");
				},
				{ immediate: false }
			);
			signal.onValue((next) => seen.push(next), { immediate: false });

			expect(() => {
				signal._ = 1;
			}).toThrow("observer boom");
			expect(seen).toEqual([1]);
		});

		it("still stores the new value when an observer throws", () => {
			const signal = new Signal(0);
			signal.onValue(
				() => {
					throw new Error("observer boom");
				},
				{ immediate: false }
			);

			expect(() => {
				signal._ = 7;
			}).toThrow();
			expect(signal._).toBe(7);
		});

		// An observer can throw a non-Error, including undefined. Tracking the
		// failure with a bare nullable value would read that as "no failure".
		it("rethrows a falsy thrown value instead of treating it as no error", () => {
			const signal = new Signal(0);
			signal.onValue(
				() => {
					throw undefined;
				},
				{ immediate: false }
			);

			let threw = false;
			try {
				signal._ = 1;
			} catch {
				threw = true;
			}
			expect(threw).toBe(true);
		});
	});

	describe("mutating the subscriber set during notification", () => {
		it("does not notify an observer added during the same pass", () => {
			const signal = new Signal(0);
			const calls: string[] = [];
			signal.onValue(
				(next) => {
					if (next === 1) signal.onValue(() => calls.push("added"), { immediate: false });
				},
				{ immediate: false }
			);

			signal._ = 1;
			expect(calls).toEqual([]);
		});

		it("does not notify an observer removed during the same pass", () => {
			const signal = new Signal(0);
			const calls: string[] = [];
			signal.onValue(
				(next) => {
					if (next === 1) off();
				},
				{ immediate: false }
			);
			const off = signal.onValue(() => calls.push("removed"), { immediate: false });

			signal._ = 1;
			expect(calls).toEqual([]);
		});
	});
});
