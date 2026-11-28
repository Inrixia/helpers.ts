import { describe, expect, it } from "vitest";
import { compareTwo, deepTypeCompare } from "../src/obj/compare.js";

describe("compareTwo", () => {
	it("accepts a value matching a single expected type", () => {
		expect(compareTwo("string", "hello", "loc")).toBe(true);
		expect(compareTwo("number", 1, "loc")).toBe(true);
	});

	it("reports a mismatch for a single expected type", () => {
		expect(compareTwo("string", 1, "loc")).toMatchObject({ expectedType: "string", received: "1:number" });
	});

	// A list of expected types is a union. The old loop returned on the first
	// non-match, so it required the value to satisfy every listed type at once.
	describe("unions", () => {
		it.each([
			[["string", "number"], "hello"],
			[["string", "number"], 42],
			[["string", "null"], null],
			[["boolean", "undefined", "object"], true],
		])("accepts %j when given %j", (expected, received) => {
			expect(compareTwo(expected, received, "loc")).toBe(true);
		});

		it("rejects a value matching none of the listed types", () => {
			expect(compareTwo(["string", "number"], true, "loc")).toMatchObject({ location: "loc" });
		});

		it("names every accepted type in the error", () => {
			const result = compareTwo(["string", "number"], true, "loc");
			expect(result).not.toBe(true);
			expect((result as { expectedType: string }).expectedType).toContain("string");
			expect((result as { expectedType: string }).expectedType).toContain("number");
		});
	});

	it("reports the location it was given", () => {
		expect(compareTwo("string", 1, "target.a.b")).toMatchObject({ location: "target.a.b" });
	});

	it("keeps the received value and its type in the error", () => {
		expect(compareTwo("string", 5, "loc")).toMatchObject({ received: "5:number" });
	});
});

describe("deepTypeCompare with union types", () => {
	it("accepts an object whose fields match one of the listed types", () => {
		const result = deepTypeCompare({ a: "text", b: 3 }, { a: ["string", "number"], b: ["string", "number"] });
		expect(result).toBe(true);
	});

	it("rejects an object with a field outside the listed types", () => {
		const result = deepTypeCompare({ a: true }, { a: ["string", "number"] });
		expect(result).not.toBe(true);
	});
});
