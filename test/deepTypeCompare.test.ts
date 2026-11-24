import { describe, expect, it } from "vitest";
import { deepTypeCompare } from "../src/obj/compare.js";

describe("deepTypeCompare", () => {
	it("accepts a matching object", () => {
		expect(deepTypeCompare({ a: "text", b: 2 }, { a: "string", b: "number" })).toBe(true);
	});

	it("rejects a field with the wrong type", () => {
		expect(deepTypeCompare({ a: 1 }, { a: "string" })).not.toBe(true);
	});

	it("checks nested objects", () => {
		expect(deepTypeCompare({ a: { b: "x" } }, { a: { b: "string" } })).toBe(true);
		expect(deepTypeCompare({ a: { b: 1 } }, { a: { b: "string" } })).not.toBe(true);
	});

	it("reports the path to the offending field", () => {
		const result = deepTypeCompare({ a: { b: 1 } }, { a: { b: "string" } });
		expect(result).not.toBe(true);
		expect((result as { location: string }).location).toBe("target.a.b");
	});

	// The loop ran over the target's keys, so a key described in `types` but
	// absent from the target was never visited and silently passed.
	describe("keys described in types but missing from the target", () => {
		it("rejects a missing top level key", () => {
			expect(deepTypeCompare({ a: 1 }, { a: "number", b: "string" })).not.toBe(true);
		});

		it("rejects a missing nested key", () => {
			expect(deepTypeCompare({ a: { b: 1 } }, { a: { b: "number", c: "string" } })).not.toBe(true);
		});

		it("reports the missing key's path", () => {
			const result = deepTypeCompare({ a: 1 }, { a: "number", b: "string" });
			expect((result as { location: string }).location).toBe("target.b");
		});
	});

	describe("keys on the target that types does not describe", () => {
		it("still rejects them", () => {
			expect(deepTypeCompare({ a: 1, z: 9 }, { a: "number" })).not.toBe(true);
		});

		// The check used `key in types`, which walks the prototype chain, so a
		// target key named like an Object.prototype member looked described.
		it("rejects a target key that only exists on Object.prototype", () => {
			expect(deepTypeCompare({ a: 1, toString: "x" }, { a: "number" })).not.toBe(true);
		});

		it("names the undescribed key in the error", () => {
			const result = deepTypeCompare({ a: 1, z: 9 }, { a: "number" });
			expect((result as { location: string }).location).toBe("target.z");
		});
	});

	// The array branch returned from inside the element loop, so only the
	// first element was ever checked.
	describe("arrays", () => {
		it("accepts an array where every element matches", () => {
			expect(deepTypeCompare({ a: [1, 2, 3] }, { a: ["number"] })).toBe(true);
		});

		it("checks every element, not just the first", () => {
			expect(deepTypeCompare({ a: [1, "x"] }, { a: ["number"] })).not.toBe(true);
		});

		it("reports which element failed", () => {
			const result = deepTypeCompare({ a: [1, "x"] }, { a: ["number"] });
			expect((result as { location: string }).location).toBe("target.a.1");
		});

		it("accepts an empty array", () => {
			expect(deepTypeCompare({ a: [] }, { a: ["number"] })).toBe(true);
		});

		it("checks every object element against the element schema", () => {
			expect(deepTypeCompare({ a: [{ x: "s" }, { x: "t" }] }, { a: [{ x: "string" }] })).toBe(true);
		});

		it("rejects an object element that does not match the element schema", () => {
			expect(deepTypeCompare({ a: [{ x: "s" }, { x: 1 }] }, { a: [{ x: "string" }] })).not.toBe(true);
		});

		// An array schema on a non-array value means "one of these types", not
		// "an array of this type". The disambiguation is the target's runtime type.
		it("treats an array schema as a list of allowed types when the value is not an array", () => {
			expect(deepTypeCompare({ a: "text" }, { a: ["string"] })).toBe(true);
		});

		it("still rejects a non-array value that matches none of the listed types", () => {
			expect(deepTypeCompare({ a: true }, { a: ["string"] })).not.toBe(true);
		});
	});

	it("rejects a non object target", () => {
		expect(deepTypeCompare(null as never, { a: "string" })).not.toBe(true);
	});
});
