import { describe, expect, it } from "vitest";
import { chunkArray } from "../src/obj/chunkArray.js";

describe("chunkArray", () => {
	it("splits an array into chunks of the requested size", () => {
		expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
	});

	it("returns the array whole when it is smaller than the chunk size", () => {
		expect(chunkArray([1, 2], 5)).toEqual([[1, 2]]);
	});

	it("splits strings", () => {
		expect(chunkArray("abcd", 2)).toEqual(["ab", "cd"]);
	});

	// i += chunkSize never advances when chunkSize is 0 or negative, so the
	// loop pushes chunks until the heap is exhausted and the process dies.
	describe("invalid chunk sizes", () => {
		it("throws for a chunk size of 0", () => {
			expect(() => chunkArray([1, 2, 3], 0)).toThrow(RangeError);
		});

		it("throws for a negative chunk size", () => {
			expect(() => chunkArray([1, 2, 3], -1)).toThrow(RangeError);
		});

		it("throws for a fractional chunk size", () => {
			expect(() => chunkArray([1, 2, 3], 1.5)).toThrow(RangeError);
		});

		it("names the offending value in the error", () => {
			expect(() => chunkArray([1, 2, 3], 0)).toThrow(/chunkSize/);
		});
	});
});
