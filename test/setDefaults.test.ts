import { describe, expect, it } from "vitest";
import { setDefaults } from "../src/obj/setDefaults.js";

describe("setDefaults", () => {
	it("fills in missing top level values", () => {
		const obj: Record<string, unknown> = {};
		setDefaults(obj, { a: 1, b: "two" });
		expect(obj).toEqual({ a: 1, b: "two" });
	});

	it("leaves existing values alone", () => {
		const obj: Record<string, unknown> = { a: 1 };
		setDefaults(obj, { a: 9 });
		expect(obj.a).toBe(1);
	});

	it("replaces null as well as undefined", () => {
		const obj: Record<string, unknown> = { a: null, b: undefined };
		setDefaults(obj, { a: 1, b: 2 });
		expect(obj).toEqual({ a: 1, b: 2 });
	});

	it("keeps falsy but present values", () => {
		const obj: Record<string, unknown> = { a: 0, b: "", c: false };
		setDefaults(obj, { a: 1, b: "x", c: true });
		expect(obj).toEqual({ a: 0, b: "", c: false });
	});

	it("returns the same object", () => {
		const obj: Record<string, unknown> = {};
		expect(setDefaults(obj, { a: 1 })).toBe(obj);
	});

	// It only ever looked at the top level, so a nested default object was
	// ignored whenever the parent key already existed.
	describe("nested defaults", () => {
		it("fills in defaults inside an existing object", () => {
			const obj: Record<string, unknown> = { a: { x: 1 } };
			setDefaults(obj, { a: { x: 9, y: 2 } });
			expect(obj).toEqual({ a: { x: 1, y: 2 } });
		});

		it("fills in deeper levels too", () => {
			const obj: Record<string, unknown> = { a: { b: { c: 1 } } };
			setDefaults(obj, { a: { b: { c: 9, d: 4 } } });
			expect(obj).toEqual({ a: { b: { c: 1, d: 4 } } });
		});

		it("assigns the whole default object when the key is missing", () => {
			const obj: Record<string, unknown> = {};
			setDefaults(obj, { a: { x: 1 } });
			expect(obj).toEqual({ a: { x: 1 } });
		});

		it("does not recurse into arrays", () => {
			const obj: Record<string, unknown> = { a: [1] };
			setDefaults(obj, { a: [9] });
			expect(obj.a).toEqual([1]);
		});
	});
});
