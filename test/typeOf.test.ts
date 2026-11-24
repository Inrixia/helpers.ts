import { describe, expect, it } from "vitest";
import { isObject, isT } from "../src/ts/isTypeOf.js";
import { typeOf } from "../src/ts/typeOf.js";

describe("typeOf", () => {
	it("distinguishes the primitives", () => {
		expect(typeOf(undefined)).toBe("undefined");
		expect(typeOf(null)).toBe("null");
		expect(typeOf(1)).toBe("number");
		expect(typeOf("s")).toBe("string");
		expect(typeOf(true)).toBe("boolean");
		expect(typeOf(1n)).toBe("bigint");
		expect(typeOf(Symbol("x"))).toBe("symbol");
		expect(typeOf(() => 1)).toBe("function");
	});

	it("tells arrays from objects", () => {
		expect(typeOf([])).toBe("array");
		expect(typeOf({})).toBe("object");
	});

	it("reports NaN", () => {
		expect(typeOf(Number.NaN)).toBe("NaN");
	});

	// The switch matched `case Infinity`, which only covers positive infinity,
	// so -Infinity fell through to "number".
	describe("infinities", () => {
		it("reports positive infinity", () => {
			expect(typeOf(Number.POSITIVE_INFINITY)).toBe("Inf");
		});

		it("reports negative infinity the same way", () => {
			expect(typeOf(Number.NEGATIVE_INFINITY)).toBe("Inf");
		});

		it("still reports ordinary numbers as numbers", () => {
			expect(typeOf(0)).toBe("number");
			expect(typeOf(-0)).toBe("number");
			expect(typeOf(1e308)).toBe("number");
		});
	});
});

describe("isT", () => {
	it("guards each type", () => {
		expect(isT("string")("s")).toBe(true);
		expect(isT("string")(1)).toBe(false);
		expect(isT("Inf")(Number.NEGATIVE_INFINITY)).toBe(true);
	});

	it("isObject rejects arrays and null", () => {
		expect(isObject({})).toBe(true);
		expect(isObject([])).toBe(false);
		expect(isObject(null)).toBe(false);
	});
});
