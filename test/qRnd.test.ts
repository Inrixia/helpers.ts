import { describe, expect, it } from "vitest";
import { qRnd } from "../src/math/qRnd.js";

describe("qRnd", () => {
	it("rounds to the requested number of decimals", () => {
		expect(qRnd(3.14159, 2)).toBe(3.14);
		expect(qRnd(3.14159, 3)).toBe(3.142);
	});

	it("defaults to zero decimals", () => {
		expect(qRnd(3.7)).toBe(4);
		expect(qRnd(3.2)).toBe(3);
	});

	// ~~ truncates toward zero, so halves always went down and the function
	// never rounded despite the name and the docstring.
	it("rounds half up rather than truncating", () => {
		expect(qRnd(2.5, 0)).toBe(3);
		expect(qRnd(3.5, 0)).toBe(4);
		expect(qRnd(0.5, 0)).toBe(1);
	});

	it("rounds up when the discarded part is above half", () => {
		expect(qRnd(1234.5678, 2)).toBe(1234.57);
	});

	it("handles floating point noise", () => {
		expect(qRnd(0.1 + 0.2, 2)).toBe(0.3);
	});

	// ~~ coerces to a signed 32 bit int, so anything past 2^31 silently
	// produced a completely wrong value.
	describe("values beyond the 32 bit range", () => {
		it("keeps large numbers intact", () => {
			expect(qRnd(2147483648, 2)).toBe(2147483648);
			expect(qRnd(2 ** 31, 0)).toBe(2 ** 31);
		});

		it("rounds large numbers instead of wrapping negative", () => {
			expect(qRnd(1e10 + 0.5, 0)).toBe(1e10 + 1);
		});

		it("still rounds the fractional part of large numbers", () => {
			expect(qRnd(1234567890.1234, 2)).toBe(1234567890.12);
		});
	});
});
