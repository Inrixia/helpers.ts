import { afterEach, describe, expect, it } from "vitest";
import { getEnv } from "../src/obj/getEnv.js";

const SET: string[] = [];
const set = (key: string, value: string): void => {
	process.env[key] = value;
	SET.push(key);
};

afterEach(() => {
	for (const key of SET.splice(0)) delete process.env[key];
});

describe("getEnv", () => {
	it("nests one level per single underscore", () => {
		set("HELPERS_TEST_ALPHA_BETA", "value");
		const env = getEnv() as Record<string, Record<string, Record<string, Record<string, string>>>>;
		expect(env.HELPERS?.TEST?.ALPHA?.BETA).toBe("value");
	});

	// The docstring claimed `some_subproperty` becomes `{ some: { subProperty } }`,
	// but the segment is used verbatim; no camel casing happens.
	it("keeps the segment casing as written", () => {
		set("HELPERS_TEST_some_subproperty", "hello");
		const env = getEnv() as Record<string, Record<string, Record<string, string>>>;
		expect(env.HELPERS?.TEST?.some?.subproperty).toBe("hello");
	});

	// Splitting happens on an underscore that is not itself preceded by one, so
	// a doubled underscore only splits once and leaves the second one in the key.
	it("keeps one underscore of a doubled pair in the segment", () => {
		set("HELPERS_TEST_A__B", "v");
		const env = getEnv() as Record<string, Record<string, Record<string, Record<string, string>>>>;
		expect(env.HELPERS?.TEST?.A?._B).toBe("v");
	});

	it("leaves the value as a string", () => {
		set("HELPERS_TEST_NUMBER", "42");
		const env = getEnv() as Record<string, Record<string, Record<string, string>>>;
		expect(env.HELPERS?.TEST?.NUMBER).toBe("42");
	});

	it("builds an object rather than a string when a key is both a leaf and a prefix", () => {
		set("HELPERS_TEST_DUP", "leaf");
		set("HELPERS_TEST_DUP_CHILD", "child");
		const env = getEnv() as Record<string, Record<string, Record<string, unknown>>>;
		const dup = env.HELPERS?.TEST?.DUP;
		expect(dup).toHaveProperty("_", "leaf");
		expect(dup).toHaveProperty("CHILD", "child");
	});

	it("includes unrelated environment variables", () => {
		set("HELPERS_TEST_MARKER", "1");
		const env = getEnv() as Record<string, Record<string, Record<string, string>>>;
		expect(env.HELPERS?.TEST?.MARKER).toBe("1");
	});
});
