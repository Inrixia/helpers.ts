import { describe, expect, it } from "vitest";
import * as mainEntry from "../src/index.js";

describe("public entry point", () => {
	// getExpect is a Vitest/Jest matcher pack. It only makes sense inside a test
	// runner, so it shouldn't be part of a runtime helper library's main exports.
	it("does not export the test matcher helper", () => {
		expect(mainEntry).not.toHaveProperty("getExpect");
	});

	it("still exports the runtime helpers", () => {
		expect(mainEntry).toHaveProperty("deepGet");
		expect(mainEntry).toHaveProperty("chunkArray");
		expect(mainEntry).toHaveProperty("Semaphore");
	});

	it("does not export matcher types at runtime", () => {
		// Types vanish at compile time, so this is mostly a guard against someone
		// re-adding `export * from "./test.js"` to index.ts.
		const exported = Object.keys(mainEntry);
		expect(exported).not.toContain("Matchers");
		expect(exported).not.toContain("EExpect");
	});
});
