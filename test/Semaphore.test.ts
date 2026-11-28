import { describe, expect, it } from "vitest";
import { Semaphore } from "../src/class/Semaphore.js";

describe("Semaphore", () => {
	it("reports the initial number of free slots", () => {
		expect(new Semaphore(3).available).toBe(3);
		expect(new Semaphore(3).pending).toBe(0);
	});

	// Nothing validated the slot count, so a negative or fractional value produced
	// a semaphore that could never hand out a slot.
	describe("constructor validation", () => {
		it("rejects a negative slot count", () => {
			expect(() => new Semaphore(-1)).toThrow(RangeError);
		});

		it("rejects a fractional slot count", () => {
			expect(() => new Semaphore(1.5)).toThrow(/availableSlots/);
		});

		it("rejects a non-finite slot count", () => {
			expect(() => new Semaphore(Number.NaN)).toThrow(RangeError);
			expect(() => new Semaphore(Number.POSITIVE_INFINITY)).toThrow(RangeError);
		});

		it("accepts zero slots, which means fully locked", () => {
			const semaphore = new Semaphore(0);
			expect(semaphore.available).toBe(0);
			expect(semaphore.pending).toBe(0);
		});
	});

	it("hands out slots up to the limit", async () => {
		const semaphore = new Semaphore(1);
		const release = await semaphore.obtain();
		expect(semaphore.available).toBe(0);
		release();
		expect(semaphore.available).toBe(1);
	});

	it("makes the next caller wait until a slot is released", async () => {
		const semaphore = new Semaphore(1);
		const release = await semaphore.obtain();
		let secondAcquired = false;
		const second = semaphore.obtain().then((rel) => {
			secondAcquired = true;
			rel();
		});
		await Promise.resolve();
		expect(secondAcquired).toBe(false);
		release();
		await second;
		expect(secondAcquired).toBe(true);
	});

	// `pending` had no equivalent, so there was no way to observe queue depth or
	// to tell whether anything was waiting.
	it("reports the number of waiters", async () => {
		const semaphore = new Semaphore(1);
		const release = await semaphore.obtain();
		expect(semaphore.pending).toBe(0);

		const waiting = [semaphore.obtain(), semaphore.obtain(), semaphore.obtain()];
		expect(semaphore.pending).toBe(3);

		release();
		await Promise.all(waiting.map((p) => p.then((rel) => rel())));
		expect(semaphore.pending).toBe(0);
	});

	it("keeps the number of callers inside the limit", async () => {
		const semaphore = new Semaphore(2);
		let inside = 0;
		let maxInside = 0;
		await Promise.all(
			Array.from({ length: 10 }, () =>
				semaphore.with(async () => {
					inside++;
					maxInside = Math.max(maxInside, inside);
					await new Promise((resolve) => setTimeout(resolve, 5));
					inside--;
				})
			)
		);
		expect(maxInside).toBe(2);
		expect(semaphore.available).toBe(2);
	});

	it("ignores a second release from the same holder", async () => {
		const semaphore = new Semaphore(1);
		const release = await semaphore.obtain();
		release();
		release();
		expect(semaphore.available).toBe(1);
	});

	it("lets obtainFirst jump ahead of earlier waiters", async () => {
		const semaphore = new Semaphore(1);
		const order: string[] = [];
		const holder = await semaphore.obtain();

		const normal = semaphore.obtain().then((rel) => {
			order.push("normal");
			rel();
		});
		const priority = semaphore.obtainFirst().then((rel) => {
			order.push("priority");
			rel();
		});

		holder();
		await Promise.all([normal, priority]);
		expect(order).toEqual(["priority", "normal"]);
	});

	it("resolves with the callback's return value from with", async () => {
		const semaphore = new Semaphore(1);
		await expect(semaphore.with(() => "value")).resolves.toBe("value");
		await expect(semaphore.withFirst(async () => 42)).resolves.toBe(42);
	});

	it("releases the slot when the callback throws", async () => {
		const semaphore = new Semaphore(1);
		await expect(
			semaphore.with(() => {
				throw new Error("boom");
			})
		).rejects.toThrow("boom");
		expect(semaphore.available).toBe(1);
	});
});
