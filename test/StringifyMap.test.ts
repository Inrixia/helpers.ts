import { describe, expect, it } from "vitest";
import { StringifyMap } from "../src/class/StringifyMap.js";

describe("StringifyMap", () => {
	it("stores and retrieves by structurally equal object keys", () => {
		const map = new StringifyMap<{ a: number }, string>();
		map.set({ a: 1 }, "one");
		expect(map.get({ a: 1 })).toBe("one");
		expect(map.has({ a: 1 })).toBe(true);
		expect(map.get({ a: 2 })).toBeUndefined();
	});

	it("reports its size", () => {
		const map = new StringifyMap<string, number>();
		map.set("a", 1);
		map.set("b", 2);
		expect(map.size).toBe(2);
	});

	it("deletes", () => {
		const map = new StringifyMap<string, number>();
		map.set("a", 1);
		expect(map.delete("a")).toBe(true);
		expect(map.delete("a")).toBe(false);
		expect(map.size).toBe(0);
	});

	it("clears", () => {
		const map = new StringifyMap<string, number>();
		map.set("a", 1);
		map.clear();
		expect(map.size).toBe(0);
		expect(map.has("a")).toBe(false);
	});

	it("distinguishes a number from its string form", () => {
		const map = new StringifyMap<number | string, string>();
		map.set(1, "number");
		map.set("1", "string");
		expect(map.size).toBe(2);
		expect(map.get(1)).toBe("number");
		expect(map.get("1")).toBe("string");
	});

	it("accepts constructor entries", () => {
		const map = new StringifyMap<string, number>([["a", 1]]);
		expect(map.get("a")).toBe(1);
		expect(map.size).toBe(1);
	});

	// Keys() used to return the JSON strings rather than the original keys, so
	// iteration handed back strings while get/set took K.
	describe("returns the original keys when iterating", () => {
		const build = () => {
			const map = new StringifyMap<object, string>();
			const first = { a: 1 };
			const second = { b: 2 };
			map.set(first, "one");
			map.set(second, "two");
			return { map, first, second };
		};

		it("iterates keys", () => {
			const { map, first, second } = build();
			expect([...map.keys()]).toEqual([first, second]);
		});

		it("iterates entries", () => {
			const { map, first, second } = build();
			expect([...map.entries()]).toEqual([
				[first, "one"],
				[second, "two"],
			]);
		});

		it("iterates values", () => {
			expect([...build().map.values()]).toEqual(["one", "two"]);
		});

		it("iterates with for...of", () => {
			const { map } = build();
			expect([...map]).toHaveLength(2);
		});

		it("supports forEach with the original key", () => {
			const { map, first, second } = build();
			const seen: object[] = [];
			map.forEach((_value, key, self) => {
				seen.push(key);
				expect(self).toBe(map);
			});
			expect(seen).toEqual([first, second]);
		});
	});

	it("reports a toStringTag of StringifyMap", () => {
		expect(Object.prototype.toString.call(new StringifyMap<string, number>())).toBe("[object StringifyMap]");
	});

	describe("documented limitations", () => {
		it("treats key property order as significant", () => {
			const map = new StringifyMap<object, string>();
			map.set({ a: 1, b: 2 }, "value");
			expect(map.get({ b: 2, a: 1 })).toBeUndefined();
		});

		it("throws for keys JSON cannot stringify", () => {
			const map = new StringifyMap<bigint, string>();
			expect(() => map.set(1n, "big")).toThrow();
		});
	});
});
