import { describe, expect, it } from "vitest";
import { DequalMap } from "../src/class/DequalMap.js";

describe("DequalMap", () => {
	it("finds a key by deep equality", () => {
		const map = new DequalMap<{ a: number }, string>();
		map.set({ a: 1 }, "one");
		expect(map.get({ a: 1 })).toBe("one");
		expect(map.has({ a: 1 })).toBe(true);
	});

	it("finds a key by identity", () => {
		const map = new DequalMap<object, string>();
		const key = { a: 1 };
		map.set(key, "one");
		expect(map.get(key)).toBe("one");
	});

	it("reports a miss for an unrelated key", () => {
		const map = new DequalMap<{ a: number }, string>();
		map.set({ a: 1 }, "one");
		expect(map.get({ a: 2 })).toBeUndefined();
		expect(map.has({ a: 2 })).toBe(false);
	});

	it("overwrites rather than duplicating on a deeply equal key", () => {
		const map = new DequalMap<{ a: number }, string>();
		map.set({ a: 1 }, "first");
		map.set({ a: 1 }, "second");
		expect(map.size).toBe(1);
		expect(map.get({ a: 1 })).toBe("second");
	});

	it("keeps the key object that was stored first", () => {
		const map = new DequalMap<object, string>();
		const original = { a: 1 };
		map.set(original, "first");
		map.set({ a: 1 }, "second");
		expect([...map.keys()][0]).toBe(original);
	});

	it("deletes by deep equality", () => {
		const map = new DequalMap<{ a: number }, string>();
		map.set({ a: 1 }, "one");
		expect(map.delete({ a: 1 })).toBe(true);
		expect(map.delete({ a: 1 })).toBe(false);
		expect(map.size).toBe(0);
	});

	it("clears", () => {
		const map = new DequalMap<{ a: number }, string>();
		map.set({ a: 1 }, "one");
		map.set({ b: 2 }, "two");
		map.clear();
		expect(map.size).toBe(0);
		expect(map.has({ a: 1 })).toBe(false);
	});

	it("accepts constructor entries", () => {
		const map = new DequalMap<{ a: number }, string>([[{ a: 1 }, "one"]]);
		expect(map.get({ a: 1 })).toBe("one");
		expect(map.size).toBe(1);
	});

	it("returns the stored key from findKey", () => {
		const map = new DequalMap<object, string>();
		const stored = { a: 1 };
		map.set(stored, "one");
		expect(map.findKey({ a: 1 })).toBe(stored);
		expect(map.findKey({ z: 9 })).toBeUndefined();
	});

	it("is still a Map, so size and iteration work", () => {
		const map = new DequalMap<object, string>();
		expect(map).toBeInstanceOf(Map);
		map.set({ a: 1 }, "one");
		expect([...map.values()]).toEqual(["one"]);
	});
});
