import { describe, expect, it } from "vitest";
import { dewPointTemp, dryBulbTemp, relativeHumidity } from "../src/conv.js";

const closeTo = (actual: number, expected: number, tolerance = 1e-6): void => {
	expect(Math.abs(actual - expected)).toBeLessThan(tolerance);
};

describe("humidity conversions", () => {
	it("round-trips dew point through dry bulb and back", () => {
		const dry = dryBulbTemp(10, 50);
		closeTo(dry, 20.803232, 1e-5);
		closeTo(relativeHumidity(dry, 10), 50, 1e-6);
	});

	it("round-trips dry bulb through dew point and back", () => {
		const dew = dewPointTemp(20, 50);
		closeTo(dryBulbTemp(dew, 50), 20, 1e-6);
	});

	it("puts the dew point below the dry bulb", () => {
		for (const rh of [10, 25, 50, 75, 90]) {
			expect(dewPointTemp(20, rh)).toBeLessThan(20);
		}
	});

	it("puts the dew point at the dry bulb at 100% humidity", () => {
		closeTo(dewPointTemp(20, 100), 20, 1e-6);
	});

	// dryBulbTemp(10, 0) was NaN, because log(0) is -Infinity. 101% produced a
	// value rather than being rejected, and a dew point above the dry bulb
	// produced a relative humidity over 100%.
	describe("input validation", () => {
		it("throws for a relative humidity of 0 or below", () => {
			expect(() => dryBulbTemp(10, 0)).toThrow(RangeError);
			expect(() => dryBulbTemp(10, -5)).toThrow(RangeError);
			expect(() => dewPointTemp(10, 0)).toThrow(RangeError);
		});

		it("throws for a relative humidity above 100", () => {
			expect(() => dryBulbTemp(10, 101)).toThrow(RangeError);
			expect(() => dewPointTemp(10, 150)).toThrow(RangeError);
		});

		it("throws for a non-finite humidity", () => {
			expect(() => dryBulbTemp(10, Number.NaN)).toThrow(RangeError);
		});

		// Only the humidity was validated, so a non-finite temperature still came
		// back as NaN, and the formula's singular point came back as Infinity.
		describe("temperatures", () => {
			it("throws for a non-finite temperature", () => {
				expect(() => dryBulbTemp(Number.NaN, 50)).toThrow(RangeError);
				expect(() => dewPointTemp(Number.POSITIVE_INFINITY, 50)).toThrow(RangeError);
				expect(() => relativeHumidity(20, Number.NaN)).toThrow(RangeError);
				expect(() => relativeHumidity(Number.NaN, 10)).toThrow(RangeError);
			});

			it("throws at the point where the formula divides by zero", () => {
				expect(() => dryBulbTemp(-243.04, 50)).toThrow(/singular/);
				expect(() => dewPointTemp(-243.04, 50)).toThrow(/singular/);
			});

			it("reports the temperature that failed", () => {
				expect(() => dryBulbTemp(Number.NaN, 50)).toThrow(/dewPointTemp/);
				expect(() => dewPointTemp(Number.NaN, 50)).toThrow(/dryBulbTemp/);
			});

			it("still accepts ordinary sub-zero temperatures", () => {
				expect(Number.isFinite(dewPointTemp(-10, 50))).toBe(true);
				expect(Number.isFinite(dryBulbTemp(-20, 50))).toBe(true);
			});
		});

		it("throws when the dew point is above the dry bulb", () => {
			expect(() => relativeHumidity(20, 30)).toThrow(RangeError);
		});

		it("allows the dew point to equal the dry bulb", () => {
			closeTo(relativeHumidity(20, 20), 100, 1e-6);
		});

		it("names the argument in the error", () => {
			expect(() => dryBulbTemp(10, 0)).toThrow(/relativeHumidity/);
			expect(() => relativeHumidity(20, 30)).toThrow(/dewPointTemp/);
		});
	});
});
