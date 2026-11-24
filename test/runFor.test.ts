import { describe, expect, it } from "vitest";
import { runFor } from "../src/fn/runFor.js";

describe("runFor", () => {
	it("returns true immediately when the predicate already passes", async () => {
		await expect(runFor(() => true, 100)).resolves.toBe(true);
	});

	// runFor always resolved to undefined, so a caller could not tell "the
	// predicate was satisfied" from "time ran out".
	it("returns false when the timeout expires without the predicate passing", async () => {
		const started = Date.now();
		await expect(runFor(() => undefined, 50)).resolves.toBe(false);
		expect(Date.now() - started).toBeGreaterThanOrEqual(45);
	});

	it("keeps polling until the predicate passes", async () => {
		let calls = 0;
		const result = await runFor(() => ++calls >= 4, 200);
		expect(result).toBe(true);
		expect(calls).toBeGreaterThanOrEqual(4);
	});

	it("treats a falsy return as not yet satisfied", async () => {
		let calls = 0;
		await runFor(() => {
			calls++;
			return false;
		}, 30);
		expect(calls).toBeGreaterThan(1);
	});

	// The loop awaited setTimeout with no delay, which is a busy poll that also
	// hammered the event loop for the whole budget.
	it("waits between polls instead of spinning", async () => {
		let calls = 0;
		const started = Date.now();
		await runFor(() => {
			calls++;
			return undefined;
		}, 60, 20);
		const elapsed = Date.now() - started;
		expect(elapsed).toBeGreaterThanOrEqual(55);
		// With a 20ms interval over ~60ms, this should be a handful of polls, not hundreds.
		expect(calls).toBeLessThan(10);
	});

	it("does not run past the deadline by more than one interval", async () => {
		const started = Date.now();
		await runFor(() => undefined, 40, 10);
		expect(Date.now() - started).toBeLessThan(40 + 100);
	});

	// An interval of 0 or less reintroduces the busy loop the interval was added
	// to prevent, so it is rejected rather than silently trusted.
	describe("argument validation", () => {
		it("rejects an interval that would spin", async () => {
			await expect(runFor(() => undefined, 10, 0)).rejects.toThrow(RangeError);
			await expect(runFor(() => undefined, 10, -1)).rejects.toThrow(/intervalMs/);
		});

		it("rejects a non-finite interval", async () => {
			await expect(runFor(() => undefined, 10, Number.NaN)).rejects.toThrow(RangeError);
		});

		it("rejects a negative or non-finite timeout", async () => {
			await expect(runFor(() => undefined, -1)).rejects.toThrow(RangeError);
			await expect(runFor(() => undefined, Number.POSITIVE_INFINITY)).rejects.toThrow(/timeoutMs/);
		});

		it("accepts a zero timeout", async () => {
			await expect(runFor(() => false, 0)).resolves.toBe(false);
		});
	});
});
