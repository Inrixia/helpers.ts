import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { debounce } from "../src/fn/debounce.js";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe("debounce", () => {
	it("does not call the function until the wait has elapsed", () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 100);
		debounced("a");
		expect(fn).not.toHaveBeenCalled();
		vi.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("calls once with the last arguments when invoked repeatedly", () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 100);
		debounced("a");
		debounced("b");
		debounced("c");
		vi.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith("c");
	});

	it("restarts the timer on each call", () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 100);
		debounced("a");
		vi.advanceTimersByTime(80);
		debounced("b");
		vi.advanceTimersByTime(80);
		expect(fn).not.toHaveBeenCalled();
		vi.advanceTimersByTime(20);
		expect(fn).toHaveBeenCalledWith("b");
	});

	// The returned function was declared async, so it returned a Promise that
	// was typed as void, and it had no cancel or flush.
	it("returns undefined rather than a promise", () => {
		const debounced = debounce(() => {}, 10);
		expect(debounced("a")).toBeUndefined();
	});

	it("forwards this", () => {
		const seen: unknown[] = [];
		const holder = {
			value: 42,
			run: debounce(function (this: { value: number }) {
				seen.push(this.value);
			}, 10),
		};
		holder.run();
		vi.advanceTimersByTime(10);
		expect(seen).toEqual([42]);
	});

	describe("cancel", () => {
		it("prevents the pending call", () => {
			const fn = vi.fn();
			const debounced = debounce(fn, 100);
			debounced("a");
			debounced.cancel();
			vi.advanceTimersByTime(200);
			expect(fn).not.toHaveBeenCalled();
		});

		it("is safe when nothing is pending", () => {
			const debounced = debounce(() => {}, 100);
			expect(() => debounced.cancel()).not.toThrow();
		});

		it("still allows later calls", () => {
			const fn = vi.fn();
			const debounced = debounce(fn, 100);
			debounced("a");
			debounced.cancel();
			debounced("b");
			vi.advanceTimersByTime(100);
			expect(fn).toHaveBeenCalledWith("b");
		});
	});

	describe("flush", () => {
		it("calls immediately with the pending arguments", () => {
			const fn = vi.fn();
			const debounced = debounce(fn, 100);
			debounced("a");
			debounced.flush();
			expect(fn).toHaveBeenCalledWith("a");
		});

		it("does not call again when the original timer would have fired", () => {
			const fn = vi.fn();
			const debounced = debounce(fn, 100);
			debounced("a");
			debounced.flush();
			vi.advanceTimersByTime(200);
			expect(fn).toHaveBeenCalledTimes(1);
		});

		it("does nothing when there is no pending call", () => {
			const fn = vi.fn();
			const debounced = debounce(fn, 100);
			debounced.flush();
			expect(fn).not.toHaveBeenCalled();
		});
	});
});
