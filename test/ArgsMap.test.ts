import { describe, expect, it } from "vitest";
import { ArgsMap } from "../src/class/ArgsMap.js";

describe("ArgsMap", () => {
	it("stores and retrieves by argument list", () => {
		const map = new ArgsMap<[number, string], string>();
		map.set([1, "a"], "first");
		expect(map.get([1, "a"])).toBe("first");
		expect(map.has([1, "a"])).toBe(true);
		expect(map.get([1, "b"])).toBeUndefined();
	});

	it("distinguishes arguments of different length", () => {
		const map = new ArgsMap<number[], number>();
		map.set([1], 1);
		map.set([1, 2], 12);
		expect(map.get([1])).toBe(1);
		expect(map.get([1, 2])).toBe(12);
	});

	it("counts distinct key paths once", () => {
		const map = new ArgsMap<number[], string>();
		map.set([1], "a");
		map.set([1], "b");
		expect(map.size).toBe(1);
		expect(map.get([1])).toBe("b");
	});

	it("deletes and reports size", () => {
		const map = new ArgsMap<number[], string>();
		map.set([1], "a");
		map.set([2], "b");
		expect(map.delete([1])).toBe(true);
		expect(map.delete([1])).toBe(false);
		expect(map.size).toBe(1);
	});

	it("clears", () => {
		const map = new ArgsMap<number[], string>();
		map.set([1], "a");
		map.clear();
		expect(map.size).toBe(0);
		expect(map.has([1])).toBe(false);
	});

	// The constructor took no entries, so passing one was silently discarded:
	// new ArgsMap([[1, "a"]]) produced an empty map with no error.
	describe("constructor entries", () => {
		it("populates from an iterable", () => {
			const map = new ArgsMap<number[], string>([
				[[1], "a"],
				[[2], "b"],
			]);
			expect(map.size).toBe(2);
			expect(map.get([1])).toBe("a");
		});

		it("accepts null", () => {
			expect(new ArgsMap<number[], string>(null).size).toBe(0);
		});
	});

	// forEach, keys and values were missing entirely, despite the class
	// otherwise looking like a Map.
	describe("Map style iteration", () => {
		const build = () => {
			const map = new ArgsMap<number[], string>();
			map.set([1], "a");
			map.set([2], "b");
			map.set([1, 2], "ab");
			return map;
		};

		it("iterates keys in depth-first order", () => {
			expect([...build().keys()]).toEqual([[1], [1, 2], [2]]);
		});

		it("iterates values in depth-first order", () => {
			expect([...build().values()]).toEqual(["a", "ab", "b"]);
		});

		it("iterates entries in depth-first order", () => {
			expect([...build().entries()]).toEqual([
				[[1], "a"],
				[[1, 2], "ab"],
				[[2], "b"],
			]);
		});

		it("iterates with for...of", () => {
			expect([...build()]).toHaveLength(3);
		});

		it("supports forEach with value, key and map", () => {
			const seen: Array<[string, number[], boolean]> = [];
			const map = build();
			map.forEach((value, key, self) => seen.push([value, key, self === map]));
			expect(seen).toEqual([
				["a", [1], true],
				["ab", [1, 2], true],
				["b", [2], true],
			]);
		});

		it("honours the thisArg passed to forEach", () => {
			const context = { collected: [] as string[] };
			build().forEach(function (this: typeof context, value: string) {
				this.collected.push(value);
			}, context);
			expect(context.collected).toEqual(["a", "ab", "b"]);
		});
	});

	it("reports a toStringTag of ArgsMap", () => {
		expect(Object.prototype.toString.call(new ArgsMap<[], never>())).toBe("[object ArgsMap]");
	});

	it("keeps setReturnValue", () => {
		const map = new ArgsMap<number[], string>();
		expect(map.setReturnValue([1], "a")).toBe("a");
		expect(map.get([1])).toBe("a");
	});
});
