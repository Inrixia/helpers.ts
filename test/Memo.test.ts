import { describe, expect, it } from "vitest";
import { memoize, memoizeArgless } from "../src/class/Memo.js";

/** Collects unhandled rejections so tests can assert none were produced. */
const trackUnhandled = () => {
	const seen: unknown[] = [];
	const onUnhandled = (reason: unknown) => seen.push(reason);
	process.on("unhandledRejection", onUnhandled);
	return {
		seen,
		async settle() {
			// Give any dangling rejection a chance to be reported.
			await new Promise((resolve) => setTimeout(resolve, 25));
		},
		stop() {
			process.off("unhandledRejection", onUnhandled);
		},
	};
};

describe("memoize error handling", () => {
	it("rejects to the caller without emitting an unhandled rejection", async () => {
		const tracker = trackUnhandled();
		try {
			const fn = memoize(async () => {
				throw new Error("generator failed");
			});
			await expect(fn()).rejects.toThrow("generator failed");
			await tracker.settle();
			expect(tracker.seen).toEqual([]);
		} finally {
			tracker.stop();
		}
	});

	it("does not cache a rejected promise", async () => {
		let calls = 0;
		const fn = memoize(async () => {
			calls++;
			if (calls === 1) throw new Error("first call fails");
			return "recovered";
		});
		await expect(fn()).rejects.toThrow("first call fails");
		await expect(fn()).resolves.toBe("recovered");
		expect(calls).toBe(2);
	});

	it("still caches successful results", async () => {
		let calls = 0;
		const fn = memoize(async (x: number) => {
			calls++;
			return x * 2;
		});
		await expect(fn(2)).resolves.toBe(4);
		await expect(fn(2)).resolves.toBe(4);
		expect(calls).toBe(1);
	});
});

describe("memoizeArgless error handling", () => {
	it("rejects to the caller without emitting an unhandled rejection", async () => {
		const tracker = trackUnhandled();
		try {
			const fn = memoizeArgless(async () => {
				throw new Error("argless generator failed");
			});
			await expect(fn()).rejects.toThrow("argless generator failed");
			await tracker.settle();
			expect(tracker.seen).toEqual([]);
		} finally {
			tracker.stop();
		}
	});

	it("does not cache a rejected promise", async () => {
		let calls = 0;
		const fn = memoizeArgless(async () => {
			calls++;
			if (calls === 1) throw new Error("first call fails");
			return "recovered";
		});
		await expect(fn()).rejects.toThrow("first call fails");
		await expect(fn()).resolves.toBe("recovered");
		expect(calls).toBe(2);
	});
});
