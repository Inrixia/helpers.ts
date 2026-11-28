import { describe, expect, it } from "vitest";
import { deepMerge } from "../src/obj/deepMerge.js";

describe("deepMerge", () => {
	it("merges nested objects", () => {
		expect(deepMerge({ a: { b: 1 } }, { a: { c: 2 } })).toEqual({ a: { b: 1, c: 2 } });
	});

	it("lets the source win on conflicts", () => {
		expect(deepMerge({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
	});

	it("adds keys that only exist on the source", () => {
		expect(deepMerge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
	});

	it("does not mutate the target", () => {
		const target = { a: { b: 1 } };
		deepMerge(target, { a: { c: 2 } });
		expect(target).toEqual({ a: { b: 1 } });
	});

	// Keys that existed only on the source were assigned by reference, so the
	// "merged" copy stayed wired to the input.
	describe("does not share references with the source", () => {
		it("clones nested objects that only exist on the source", () => {
			const source = { nested: { deep: { v: 1 } } };
			const merged = deepMerge({ other: 1 }, source);
			(merged as typeof source).nested.deep.v = 999;
			expect(source.nested.deep.v).toBe(1);
		});

		it("clones arrays", () => {
			const source = { list: [1, 2, 3] };
			const merged = deepMerge({}, source);
			(merged as typeof source).list.push(4);
			expect(source.list).toEqual([1, 2, 3]);
		});

		it("clones objects inside arrays", () => {
			const source = { list: [{ v: 1 }] };
			const merged = deepMerge({}, source);
			(merged as typeof source).list[0].v = 99;
			expect(source.list[0].v).toBe(1);
		});
	});

	// There was no cycle tracking at all, so a self-referencing source recursed
	// until the stack blew.
	describe("circular references", () => {
		it("does not blow the stack on a self-referencing source", () => {
			const source: Record<string, unknown> = { y: 2 };
			source.self = source;
			expect(() => deepMerge({ x: 1 }, source)).not.toThrow();
		});

		it("does not blow the stack when both sides are self-referencing", () => {
			const target: Record<string, unknown> = { x: 1 };
			target.self = target;
			const source: Record<string, unknown> = { y: 2 };
			source.self = source;
			expect(() => deepMerge(target, source)).not.toThrow();
		});

		it("preserves the circular shape in the result", () => {
			const source: Record<string, unknown> = { y: 2 };
			source.self = source;
			const merged = deepMerge({ x: 1 }, source) as Record<string, unknown>;
			expect(merged.y).toBe(2);
			expect(merged.self).toBe(merged);
		});
	});

	it("replaces an array rather than merging by index", () => {
		expect(deepMerge({ a: [1, 2, 3] }, { a: [9] })).toEqual({ a: [9] });
	});
});
