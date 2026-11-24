import { describe, expect, it } from "vitest";
import { toRange } from "../src/fn/toRange.js";

describe("toRange", () => {
	it("matches the documented example", () => {
		expect(toRange([1, 2, 3, 12, 6, 7, 5, 27, 28, 29, 40, 41, 25, 42, 12])).toBe("1-3 & 5-7 & 12 & 25 & 27-29 & 40-42");
	});

	it("sorts before grouping", () => {
		expect(toRange([3, 1, 2])).toBe("1-3");
	});

	it("collapses duplicates", () => {
		expect(toRange([7, 7, 7])).toBe("7");
	});

	it("handles a single value", () => {
		expect(toRange([5])).toBe("5");
		expect(toRange([0])).toBe("0");
	});

	// There was no empty check, and `${array[0]}` on an empty array is the
	// string "undefined".
	it("returns an empty string for an empty array", () => {
		expect(toRange([])).toBe("");
	});

	it("drops values that can't be part of a range", () => {
		expect(toRange([1, Number.NaN, 3])).toBe("1 & 3");
		expect(toRange([1, Number.POSITIVE_INFINITY])).toBe("1");
		expect(toRange([Number.NaN])).toBe("");
	});

	it("groups consecutive negative numbers", () => {
		expect(toRange([-3, -2, -1, 5])).toBe("-3--1 & 5");
	});

	it("groups consecutive values with a fractional step of one", () => {
		expect(toRange([1.5, 2.5, 3.5])).toBe("1.5-3.5");
	});

	it("does not mutate the input", () => {
		const input = [3, 1, 2];
		toRange(input);
		expect(input).toEqual([3, 1, 2]);
	});
});
