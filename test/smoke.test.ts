import { describe, expect, it } from "vitest";
import { sleep } from "../src/fn/sleep.js";
import { toRange } from "../src/fn/toRange.js";

describe("test setup", () => {
	it("resolves .js specifiers in source imports", () => {
		expect(typeof sleep).toBe("function");
		expect(typeof toRange).toBe("function");
	});
});
