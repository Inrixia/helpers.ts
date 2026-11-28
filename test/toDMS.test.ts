import { describe, expect, it } from "vitest";
import { toDMS } from "../src/geo.js";

describe("toDMS", () => {
	it("converts a positive coordinate", () => {
		expect(toDMS(33.8688)).toEqual({ degrees: 33, minutes: 52, seconds: 8, sign: 1 });
	});

	it("converts zero", () => {
		expect(toDMS(0)).toEqual({ degrees: 0, minutes: 0, seconds: 0, sign: 1 });
	});

	it("handles a coordinate below one degree", () => {
		expect(toDMS(0.5)).toEqual({ degrees: 0, minutes: 30, seconds: 0, sign: 1 });
	});

	it("rounds the seconds instead of truncating them", () => {
		// 0.8688 * 60 = 52.128 minutes, remainder 0.128 * 60 = 7.68 seconds.
		// Truncating gave 7.
		expect(toDMS(33.8688).seconds).toBe(8);
	});

	// Math.abs() threw the sign away, so north/south and east/west were
	// indistinguishable.
	describe("negative coordinates", () => {
		it("reports the sign", () => {
			expect(toDMS(-33.8688).sign).toBe(-1);
			expect(toDMS(33.8688).sign).toBe(1);
		});

		it("keeps the degrees positive and reports the sign separately", () => {
			expect(toDMS(-33.8688)).toEqual({ degrees: 33, minutes: 52, seconds: 8, sign: -1 });
		});

		it("reports a negative sign for a coordinate just below zero", () => {
			expect(toDMS(-0.5)).toEqual({ degrees: 0, minutes: 30, seconds: 0, sign: -1 });
		});
	});

	// Rounding seconds can reach 60, which is not a valid seconds value.
	describe("carrying on rounding", () => {
		it("carries 60 seconds into minutes", () => {
			const result = toDMS(33.999999);
			expect(result.seconds).toBeLessThan(60);
			expect(result).toEqual({ degrees: 34, minutes: 0, seconds: 0, sign: 1 });
		});

		it("never returns 60 seconds for a spread of values", () => {
			for (let i = 0; i < 5000; i++) {
				const result = toDMS(i / 1000);
				expect(result.seconds).toBeLessThan(60);
				expect(result.minutes).toBeLessThan(60);
			}
		});
	});
});
