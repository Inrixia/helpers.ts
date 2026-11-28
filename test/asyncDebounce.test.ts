import { describe, expect, it } from "vitest";
import { asyncDebounce } from "../src/fn/asyncDebounce.js";

/** Collects unhandled rejections so tests can assert none were produced. */
const trackUnhandled = () => {
	const seen: unknown[] = [];
	const onUnhandled = (reason: unknown) => seen.push(reason);
	process.on("unhandledRejection", onUnhandled);
	return {
		seen,
		async settle() {
			await new Promise((resolve) => setTimeout(resolve, 25));
		},
		stop() {
			process.off("unhandledRejection", onUnhandled);
		},
	};
};

describe("asyncDebounce error handling", () => {
	it("rejects to the caller without an unhandled rejection (args ignored)", async () => {
		const tracker = trackUnhandled();
		try {
			const fn = asyncDebounce(async () => {
				throw new Error("argless failed");
			}, true);
			await expect(fn()).rejects.toThrow("argless failed");
			await tracker.settle();
			expect(tracker.seen).toEqual([]);
		} finally {
			tracker.stop();
		}
	});

	it("rejects to the caller without an unhandled rejection (per args)", async () => {
		const tracker = trackUnhandled();
		try {
			const fn = asyncDebounce(async (x: number) => {
				throw new Error(`failed for ${x}`);
			});
			await expect(fn(1)).rejects.toThrow("failed for 1");
			await tracker.settle();
			expect(tracker.seen).toEqual([]);
		} finally {
			tracker.stop();
		}
	});

	it("releases the slot after a failure so the next call runs again", async () => {
		let calls = 0;
		const fn = asyncDebounce(async (x: number) => {
			calls++;
			if (calls === 1) throw new Error("first call fails");
			return x;
		});
		await expect(fn(1)).rejects.toThrow("first call fails");
		await expect(fn(1)).resolves.toBe(1);
		expect(calls).toBe(2);
	});

	it("still dedupes concurrent calls for the same args", async () => {
		let calls = 0;
		const fn = asyncDebounce(async (x: number) => {
			calls++;
			await new Promise((resolve) => setTimeout(resolve, 10));
			return x * 2;
		});
		const [a, b] = await Promise.all([fn(3), fn(3)]);
		expect(a).toBe(6);
		expect(b).toBe(6);
		expect(calls).toBe(1);
	});

	// The argless path was chosen by reading generator.length, which is 0 for any
	// function whose first parameter has a default, so the arguments were dropped
	// and every call ran the generator with no arguments at all.
	it("does not treat a zero-length generator as argument-less", async () => {
		let calls = 0;
		const fn = asyncDebounce(async (x = 1) => {
			calls++;
			return x * 2;
		});
		await expect(fn(5)).resolves.toBe(10);
		await expect(fn(99)).resolves.toBe(198);
		expect(calls).toBe(2);
	});

	it("honours ignoreArgs when it is set explicitly", async () => {
		let calls = 0;
		const fn = asyncDebounce(async (x: number) => {
			calls++;
			return x;
		}, true);
		// The ignored-args path calls the generator with no arguments, so x is undefined.
		await expect(fn(5)).resolves.toBeUndefined();
		expect(calls).toBe(1);
	});
});
