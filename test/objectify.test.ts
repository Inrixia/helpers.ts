import { describe, expect, expectTypeOf, it } from "vitest";
import { objectify } from "../src/obj/objectify.js";

describe("objectify", () => {
	it("round-trips plain data like JSON.parse(JSON.stringify(x))", () => {
		const input = { a: 1, b: [2, 7] };
		expect(objectify(input)).toEqual(JSON.parse(JSON.stringify(input)));
	});

	it("returns a detached copy", () => {
		const input = { a: { b: 1 } };
		const output = objectify(input);
		output.a.b = 99;
		expect(input.a.b).toBe(1);
	});

	it("drops keys whose value is undefined", () => {
		expect(objectify({ a: 1, b: undefined })).toEqual({ a: 1 });
	});

	// The declared return type was T, so callers were told a Date came back.
	describe("types match what JSON can actually represent", () => {
		it("types a Date result as a string", () => {
			const result = objectify(new Date(0));
			expectTypeOf(result).toBeString();
			expect(result).toBe("1970-01-01T00:00:00.000Z");
		});

		it("keeps primitive types", () => {
			expectTypeOf(objectify(5)).toBeNumber();
			expectTypeOf(objectify("x")).toBeString();
			expectTypeOf(objectify(true)).toBeBoolean();
		});

		it("keeps the shape of a plain object", () => {
			const result = objectify({ a: 1, b: "two" });
			expectTypeOf(result).toEqualTypeOf<{ a: number; b: string }>();
		});
	});

	describe("values JSON cannot represent", () => {
		it("throws a clear error for undefined", () => {
			expect(() => objectify(undefined)).toThrow(TypeError);
			expect(() => objectify(undefined)).toThrow(/cannot be represented as JSON/);
		});

		it("throws a clear error for a function", () => {
			expect(() => objectify(() => 1)).toThrow(/cannot be represented as JSON/);
		});

		it("throws for a symbol", () => {
			expect(() => objectify(Symbol("x"))).toThrow(/cannot be represented as JSON/);
		});

		it("throws for BigInt", () => {
			expect(() => objectify(1n)).toThrow(TypeError);
		});
	});
});
