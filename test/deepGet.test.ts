import { describe, expect, it } from "vitest";
import { deepGet } from "../src/obj/deepGet.js";

describe("deepGet", () => {
	it("matches the documented example", () => {
		const object = { a: { child: "Hello World" } };
		expect(deepGet(object, "a.child")).toBe("Hello World");
	});

	it("returns undefined for a missing path", () => {
		expect(deepGet({ a: 1 }, "a.b.c")).toBeUndefined();
		expect(deepGet({}, "a")).toBeUndefined();
	});

	it("walks array indices", () => {
		expect(deepGet({ a: [{ v: 7 }] }, "a.0.v")).toBe(7);
	});

	it("supports a custom delimiter", () => {
		expect(deepGet({ a: { b: 1 } }, "a/b", "/")).toBe(1);
	});

	// The traversal loop stopped as soon as an intermediate value was falsy,
	// which both returned the wrong value and left the rest of the path unread.
	describe("falsy values", () => {
		it("returns a falsy leaf", () => {
			expect(deepGet({ a: { b: 0 } }, "a.b")).toBe(0);
			expect(deepGet({ a: { b: false } }, "a.b")).toBe(false);
			expect(deepGet({ a: { b: "" } }, "a.b")).toBe("");
			expect(deepGet({ a: { b: null } }, "a.b")).toBeNull();
		});

		it("keeps walking past a falsy intermediate value", () => {
			// b is 0, so a.b.c cannot exist. It used to return 0, the value of a.b.
			expect(deepGet({ a: { b: 0, c: 5 } }, "a.b.c")).toBeUndefined();
		});

		it("keeps walking past an empty string intermediate value", () => {
			expect(deepGet({ a: { b: "", c: 5 } }, "a.b.c")).toBeUndefined();
		});

		it("reads a sibling of a falsy value", () => {
			expect(deepGet({ a: { b: 0, c: 5 } }, "a.c")).toBe(5);
		});
	});
});
