import { describe, expect, it } from "vitest";
import { memoize } from "../src/class/Memo.js";

describe("memoize", () => {
	it("caches by argument", () => {
		let calls = 0;
		const fn = memoize((a: number, b: number) => {
			calls++;
			return a + b;
		});
		expect(fn(1, 2)).toBe(3);
		expect(fn(1, 2)).toBe(3);
		expect(fn(1, 3)).toBe(4);
		expect(calls).toBe(2);
	});

	it("caches an argument-less generator", () => {
		let calls = 0;
		const fn = memoize(() => ++calls);
		expect(fn()).toBe(1);
		expect(fn()).toBe(1);
		expect(calls).toBe(1);
	});

	// memoize sniffed generator.length to decide whether the function took
	// arguments. A default or rest parameter makes length 0, so those functions
	// had every argument silently ignored and returned the first cached result.
	describe("generators whose length is 0 but which do take arguments", () => {
		it("caches a generator with a default parameter by argument", () => {
			let calls = 0;
			const fn = memoize((x = 1) => {
				calls++;
				return x * 10;
			});
			expect(fn(5)).toBe(50);
			expect(fn(99)).toBe(990);
			expect(calls).toBe(2);
		});

		it("caches a generator with a rest parameter by argument", () => {
			const fn = memoize((...xs: number[]) => xs.length);
			expect(fn(1, 2)).toBe(2);
			expect(fn(1)).toBe(1);
			expect(fn()).toBe(0);
		});

		it("distinguishes different default-parameter calls", () => {
			const fn = memoize((x = 0) => x);
			expect(fn(1)).toBe(1);
			expect(fn(2)).toBe(2);
			expect(fn(1)).toBe(1);
		});
	});

	it("reports the same arity as the function it wraps", () => {
		expect(memoize((a: number, b: number) => a + b).length).toBe(2);
		expect(memoize((a: number) => a).length).toBe(1);
		expect(memoize(() => 1).length).toBe(0);
	});

	it("can clear a single cached entry", () => {
		let calls = 0;
		const fn = memoize((x: number) => {
			calls++;
			return x;
		});
		fn(1);
		fn.clear(1);
		fn(1);
		expect(calls).toBe(2);
	});
});
