import { describe, expect, it } from "vitest";
import { isKeyOf } from "../src/ts/isKeyOf.js";

describe("isKeyOf", () => {
	it("accepts keys that exist on the record", () => {
		const has = isKeyOf({ a: 1, b: 2 });
		expect(has("a")).toBe(true);
		expect(has("b")).toBe(true);
	});

	it("rejects keys that do not exist", () => {
		const has = isKeyOf({ a: 1 });
		expect(has("z")).toBe(false);
	});

	it("treats a present key with an undefined value as present", () => {
		const has = isKeyOf({ a: undefined } as { a: undefined });
		expect(has("a")).toBe(true);
	});

	it("works as a narrowing guard", () => {
		const record: Record<string, unknown> = { a: 1 };
		const key: string = "a";
		if (isKeyOf(record)(key)) {
			expect(record[key]).toBe(1);
		}
	});

	// The guard used the `in` operator, which walks the prototype chain, so any
	// Object.prototype member was reported as a key of every record.
	describe("prototype members", () => {
		it("rejects Object.prototype keys", () => {
			const has = isKeyOf({ a: 1 });
			for (const inherited of ["toString", "constructor", "hasOwnProperty", "valueOf", "__proto__"]) {
				expect(has(inherited)).toBe(false);
			}
		});

		it("rejects inherited prototype methods", () => {
			class Base {
				method() {
					return 1;
				}
			}
			class Child extends Base {}
			const has = isKeyOf(new Child() as unknown as Record<string, unknown>);
			expect(has("method")).toBe(false);
		});

		it("accepts own fields assigned by the constructor", () => {
			class WithField {
				field = 1;
			}
			const has = isKeyOf(new WithField() as unknown as Record<string, unknown>);
			expect(has("field")).toBe(true);
		});
	});
});
