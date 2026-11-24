import { describe, expect, it } from "vitest";
import { nPad } from "../src/math/nPad.js";

describe("nPad", () => {
	it("pads to the default width of 2", () => {
		expect(nPad(5)).toBe("05");
		expect(nPad(9)).toBe("09");
	});

	it("pads to an explicit width", () => {
		expect(nPad(6, 3)).toBe("006");
		expect(nPad(7, 4)).toBe("0007");
	});

	it("leaves values that are already wide enough alone", () => {
		expect(nPad(123, 2)).toBe("123");
		expect(nPad(123, 3)).toBe("123");
	});

	it("handles zero", () => {
		expect(nPad(0)).toBe("00");
		expect(nPad(0, 0)).toBe("0");
	});

	it("leaves non-numeric strings alone", () => {
		expect(nPad("abc", 2)).toBe("abc");
	});

	// The padding loop prepended zeros to the whole string, so the sign ended up
	// in the middle: -5 padded to 3 became "0-5".
	describe("negative numbers", () => {
		it("pads the magnitude, not the sign", () => {
			expect(nPad(-5, 3)).toBe("-05");
		});

		it("keeps the requested total width", () => {
			expect(nPad(-123, 5)).toBe("-0123");
			expect(nPad(-5, 3)).toHaveLength(3);
			expect(nPad(-123, 5)).toHaveLength(5);
		});

		it("leaves negative values that are already wide enough alone", () => {
			expect(nPad(-42, 2)).toBe("-42");
			expect(nPad(-42, 1)).toBe("-42");
		});
	});

	it("does not truncate", () => {
		expect(nPad(12345, 2)).toBe("12345");
	});
});
