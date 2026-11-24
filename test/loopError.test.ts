import { describe, expect, it } from "vitest";
import { loopError } from "../src/fn/loopError.js";

type Outcome<T> = { status: "resolved"; value: T } | { status: "rejected"; error: unknown } | "timed-out";

/** Settles either way within `ms`, so a promise that never settles fails instead of hanging the suite. */
const settleWithin = async <T>(promise: Promise<T>, ms = 250): Promise<Outcome<T>> => {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<"timed-out">((resolve) => {
		timer = setTimeout(() => resolve("timed-out"), ms);
	});
	try {
		return await Promise.race([
			promise.then(
				(value): Outcome<T> => ({ status: "resolved", value }),
				(error): Outcome<T> => ({ status: "rejected", error })
			),
			timeout,
		]);
	} finally {
		if (timer) clearTimeout(timer);
	}
};

describe("loopError", () => {
	it("retries until func succeeds when the handler resolves", async () => {
		let attempts = 0;
		const result = await loopError(
			async () => {
				if (attempts++ < 2) throw new Error("not yet");
				return "done";
			},
			async () => {}
		);
		expect(result).toBe("done");
		expect(attempts).toBe(3);
	});

	it("returns the value when func succeeds immediately", async () => {
		await expect(loopError(async () => "first try", async () => {})).resolves.toBe("first try");
	});

	// The default handler is `(err) => reject(err)`. It is only wired to the
	// outer promise via `.then(() => ...)`, so its rejection was dropped and
	// the returned promise never settled.
	it("rejects instead of hanging when the handler rejects", async () => {
		const outcome = await settleWithin(
			loopError(
				async () => {
					throw new Error("func failed");
				},
				async () => {
					throw new Error("handler failed");
				}
			)
		);
		expect(outcome).not.toBe("timed-out");
		expect(outcome).toMatchObject({ status: "rejected" });
	});

	it("rejects instead of hanging when the handler throws synchronously", async () => {
		const outcome = await settleWithin(
			loopError(
				async () => {
					throw new Error("func failed");
				},
				(() => {
					throw new Error("handler threw");
				}) as unknown as () => Promise<void>
			)
		);
		expect(outcome).not.toBe("timed-out");
		expect(outcome).toMatchObject({ status: "rejected" });
	});

	it("propagates the original error when the default handler is used", async () => {
		const outcome = await settleWithin(
			loopError(async () => {
				throw new Error("original failure");
			})
		);
		expect(outcome).not.toBe("timed-out");
		expect(outcome).toMatchObject({ status: "rejected" });
		expect((outcome as Exclude<Outcome<never>, "timed-out">).error).toBeInstanceOf(Error);
		expect(((outcome as Exclude<Outcome<never>, "timed-out">).error as Error).message).toBe("original failure");
	});
});
