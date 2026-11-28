import { describe, expect, it } from "vitest";
import { Promize } from "../src/class/Promize.js";

const settleWithin = async <T>(promise: Promise<T>, ms = 100): Promise<T | "pending"> => {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<"pending">((resolve) => {
		timer = setTimeout(() => resolve("pending"), ms);
	});
	try {
		return await Promise.race([promise, timeout]);
	} finally {
		if (timer) clearTimeout(timer);
	}
};

describe("Promize", () => {
	it("resolves with the value given to the constructor", async () => {
		await expect(new Promize(5)).resolves.toBe(5);
	});

	// The constructor treated `undefined` as "no value supplied", so
	// new Promize(undefined) stayed pending forever with no way to tell.
	describe("undefined as a value", () => {
		it("resolves with undefined when passed to the constructor", async () => {
			const promize = new Promize<string | undefined>(undefined);
			await expect(settleWithin(promize.then((value) => value))).resolves.toBe(undefined);
		});

		it("resolves with undefined when passed to set", async () => {
			const promize = new Promize<string | undefined>();
			promize.set(undefined);
			await expect(settleWithin(promize.then((value) => `value:${value}`))).resolves.toBe("value:undefined");
		});
	});

	it("stays pending when constructed with no value", async () => {
		const promize = new Promize<number>();
		expect(await settleWithin(promize.then((value) => value))).toBe("pending");
	});

	it("can be resolved later through res", async () => {
		const promize = new Promize<number>();
		promize.res(42);
		await expect(promize).resolves.toBe(42);
	});

	it("can be rejected through rej", async () => {
		const promize = new Promize<number>();
		promize.rej(new Error("nope"));
		await expect(promize).rejects.toThrow("nope");
	});

	it("supports catch and finally", async () => {
		const promize = new Promize<number>();
		let finallyRan = false;
		const handled = promize.catch((error: Error) => `caught ${error.message}`);
		void promize
			.finally(() => {
				finallyRan = true;
			})
			// finally() rejects when the original does; swallow it here so the test
			// doesn't report an unhandled rejection of its own.
			.catch(() => {});
		promize.rej(new Error("boom"));
		await expect(handled).resolves.toBe("caught boom");
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(finallyRan).toBe(true);
	});

	it("replaces the underlying promise on reset", async () => {
		const promize = new Promize<number>();
		promize.reset();
		promize.res(1);
		await expect(promize).resolves.toBe(1);
	});

	it("is thenable and reports a toStringTag of Promise", () => {
		const promize = new Promize<number>();
		expect(typeof promize.then).toBe("function");
		expect(Object.prototype.toString.call(promize)).toBe("[object Promise]");
		promize.res(1);
	});
});
