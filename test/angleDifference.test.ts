import { describe, expect, it } from "vitest";
import { angleDifference } from "../src/math/angleDifference.js";

describe("angleDifference", () => {
	it("returns 0 for equal angles", () => {
		expect(angleDifference(45, 45)).toBe(0);
		expect(angleDifference(0, 0)).toBe(0);
	});

	it("takes the short way around the circle", () => {
		expect(angleDifference(10, 350)).toBe(20);
		expect(angleDifference(350, 10)).toBe(-20);
	});

	it("is signed by default", () => {
		expect(angleDifference(0, 90)).toBe(-90);
		expect(angleDifference(90, 0)).toBe(90);
	});

	it("returns an absolute value when signed is false", () => {
		expect(angleDifference(0, 90, false)).toBe(90);
		expect(angleDifference(90, 0, false)).toBe(90);
		expect(angleDifference(10, 350, false)).toBe(20);
	});

	it("treats 0 and 360 as the same angle", () => {
		expect(angleDifference(0, 360)).toBe(0);
		expect(angleDifference(360, 0)).toBe(0);
	});

	// The sign test compared raw inputs against 0-360 windows, so anything
	// outside that range fell through to the wrong branch. 400 is the same
	// angle as 40, but 400 vs 10 reported -30 where 40 vs 10 reports 30.
	describe("angles outside 0-360", () => {
		it.each([
			[400, 10, 30],
			[10, 400, -30],
			[-10, 10, -20],
			[10, -10, 20],
			[720, 0, 0],
			[-360, 0, 0],
			[370, 0, 10],
		])("angleDifference(%i, %i) is %i", (a, b, expected) => {
			expect(angleDifference(a, b)).toBe(expected);
		});

		it("matches the equivalent normalised angles", () => {
			for (const offset of [-720, -360, 360, 720, 1080]) {
				expect(angleDifference(45 + offset, 45)).toBe(0);
				expect(angleDifference(0, 90 + offset)).toBe(angleDifference(0, 90));
			}
		});
	});

	it("stays within -180 to 180", () => {
		for (let a = -720; a <= 720; a += 7) {
			for (let b = -720; b <= 720; b += 11) {
				const result = angleDifference(a, b);
				expect(result).toBeGreaterThanOrEqual(-180);
				expect(result).toBeLessThanOrEqual(180);
			}
		}
	});
});
