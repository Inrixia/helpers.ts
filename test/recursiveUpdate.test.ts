import { describe, expect, it } from "vitest";
import { recursiveUpdate } from "../src/obj/RecursiveUpdateOptions.js";

describe("recursiveUpdate", () => {
	it("fills in undefined properties by default", () => {
		const target: Record<string, unknown> = { a: undefined, b: 2 };
		recursiveUpdate(target, { a: 1, b: 9 });
		expect(target).toEqual({ a: 1, b: 2 });
	});

	it("does not overwrite defined properties by default", () => {
		const target: Record<string, unknown> = { a: 1 };
		recursiveUpdate(target, { a: 2 });
		expect(target.a).toBe(1);
	});

	it("recurses into nested objects", () => {
		const target: Record<string, unknown> = { a: { b: undefined }, c: 1 };
		recursiveUpdate(target, { a: { b: 2, d: 3 } });
		expect(target).toEqual({ a: { b: 2, d: 3 }, c: 1 });
	});

	it("rejects non-object arguments", () => {
		expect(() => recursiveUpdate([], { a: 1 })).toThrow(/targetObject/);
		expect(() => recursiveUpdate({}, [])).toThrow(/newObject/);
	});

	// The loop used for...in, which also visits inherited enumerable properties,
	// so a prototype key would have been copied onto the target.
	it("ignores inherited enumerable properties", () => {
		const target: Record<string, unknown> = {};
		const source = Object.create({ inherited: "from prototype" }) as Record<string, unknown>;
		source.own = "from source";
		recursiveUpdate(target, source);
		expect(target).toEqual({ own: "from source" });
		expect(Object.hasOwn(target, "inherited")).toBe(false);
	});

	// The options parameter had a whole default object, so it was only applied
	// when options was omitted entirely. Passing { setDefined: true } left
	// setUndefined as undefined, which is falsy, so the documented default of
	// true silently did not apply.
	describe("partial options", () => {
		it("keeps setUndefined defaulting to true when only setDefined is passed", () => {
			const target: Record<string, unknown> = { a: undefined, b: 2 };
			recursiveUpdate(target, { a: 1, b: 9 }, { setDefined: true });
			expect(target).toEqual({ a: 1, b: 9 });
		});

		it("keeps setDefined defaulting to false when only setUndefined is passed", () => {
			const target: Record<string, unknown> = { a: undefined, b: 2 };
			recursiveUpdate(target, { a: 1, b: 9 }, { setUndefined: false });
			expect(target).toEqual({ a: undefined, b: 2 });
		});

		it("can turn both off", () => {
			const target: Record<string, unknown> = { a: undefined, b: 2 };
			recursiveUpdate(target, { a: 1, b: 9 }, { setUndefined: false, setDefined: false });
			expect(target).toEqual({ a: undefined, b: 2 });
		});

		it("can turn both on", () => {
			const target: Record<string, unknown> = { a: undefined, b: 2 };
			recursiveUpdate(target, { a: 1, b: 9 }, { setUndefined: true, setDefined: true });
			expect(target).toEqual({ a: 1, b: 9 });
		});

		it("passes the resolved options down into nested objects", () => {
			const target: Record<string, unknown> = { a: { b: undefined, c: 2 } };
			recursiveUpdate(target, { a: { b: 1, c: 9 } }, { setDefined: true });
			expect(target).toEqual({ a: { b: 1, c: 9 } });
		});
	});
});
