import { describe, expect, it } from "vitest";
import { retry } from "../src/fn/retry.js";

const failAlways = () => {
	let attempts = 0;
	const run = retry(
		async () => {
			attempts++;
			throw new Error("always fails");
		},
		{ maxRetries: 2, timeoutMultiplier: 0 }
	);
	return { run, attempts: () => attempts };
};

describe("retry", () => {
	it("returns the value once func stops failing", async () => {
		let attempts = 0;
		const run = retry(
			async () => {
				if (++attempts < 3) throw new Error("not yet");
				return "done";
			},
			{ maxRetries: 5, timeoutMultiplier: 0 }
		);
		await expect(run()).resolves.toBe("done");
		expect(attempts).toBe(3);
	});

	it("rethrows once maxRetries is exhausted", async () => {
		const failing = failAlways();
		await expect(failing.run()).rejects.toThrow("always fails");
		expect(failing.attempts()).toBe(3);
	});

	// retryCount lived in the closure of retry(), so it was shared by every
	// call of the returned function. A second call started already exhausted
	// and gave up after a single attempt.
	it("uses a fresh retry budget on every invocation", async () => {
		const failing = failAlways();

		await expect(failing.run()).rejects.toThrow("always fails");
		expect(failing.attempts()).toBe(3);

		const afterFirstRun = failing.attempts();
		await expect(failing.run()).rejects.toThrow("always fails");
		expect(failing.attempts() - afterFirstRun).toBe(3);
	});

	it("can succeed on a later invocation after an earlier one was exhausted", async () => {
		let shouldFail = true;
		const run = retry(
			async () => {
				if (shouldFail) throw new Error("nope");
				return "recovered";
			},
			{ maxRetries: 2, timeoutMultiplier: 0 }
		);

		await expect(run()).rejects.toThrow("nope");
		shouldFail = false;
		await expect(run()).resolves.toBe("recovered");
	});

	it("reports the attempt index to onErr", async () => {
		const reported: number[] = [];
		const run = retry(
			async () => {
				throw new Error("boom");
			},
			{ maxRetries: 2, timeoutMultiplier: 0, onErr: (_err, retryCount) => reported.push(retryCount) }
		);
		await expect(run()).rejects.toThrow("boom");
		expect(reported).toEqual([0, 1, 2]);
	});

	it("does not sleep when timeoutMultiplier is 0", async () => {
		const started = Date.now();
		const run = retry(
			async () => {
				throw new Error("boom");
			},
			{ maxRetries: 5, timeoutMultiplier: 0 }
		);
		await expect(run()).rejects.toThrow("boom");
		expect(Date.now() - started).toBeLessThan(100);
	});
});
