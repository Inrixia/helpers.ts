import { describe, expect, it } from "vitest";
import { fillTemplate } from "../src/obj/fillTemplate.js";

describe("fillTemplate", () => {
	it("replaces top level keys", () => {
		expect(fillTemplate({ title: "Hello" }, "Say {title}!")).toBe("Say Hello!");
	});

	it("replaces nested keys with dotted paths", () => {
		expect(fillTemplate({ info: { desc: "some info" } }, "Here: {info.desc}")).toBe("Here: some info");
	});

	it("replaces every occurrence", () => {
		expect(fillTemplate({ x: "1" }, "{x} and {x}")).toBe("1 and 1");
	});

	it("leaves unknown placeholders alone", () => {
		expect(fillTemplate({ a: 1 }, "x {b} y")).toBe("x {b} y");
	});

	it("leaves empty braces alone", () => {
		expect(fillTemplate({ a: 1 }, "{} {a}")).toBe("{} 1");
	});

	// The key used to be interpolated straight into a RegExp, so any key
	// containing a regex metacharacter threw or matched the wrong thing.
	describe("keys containing regex metacharacters", () => {
		it.each([
			["a(b", "parenthesis"],
			["a[0]", "bracket"],
			["a+", "plus"],
			["a*", "star"],
			["a?", "question mark"],
			["a|b", "pipe"],
			["a\\d", "backslash"],
			["a.b", "dot"],
		])("handles %s (%s)", (key, _label) => {
			expect(fillTemplate({ [key]: "value" }, `pre {${key}} post`)).toBe("pre value post");
		});
	});

	// String.prototype.replace interprets $$, $&, $` and $1 in the replacement.
	// The old code passed String(value) as the replacement, so values that
	// looked like those patterns were expanded into the output.
	describe("values containing replacement patterns", () => {
		it.each([
			["$&", "match reference"],
			["$1", "capture reference"],
			["$`", "backtick reference"],
			["$$", "dollar escape"],
			["${name}", "template literal"],
			["$'", "quote reference"],
		])("keeps %s literal (%s)", (value) => {
			expect(fillTemplate({ val: value }, "cost {val}")).toBe(`cost ${value}`);
		});
	});
});
