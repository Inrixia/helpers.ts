import { afterEach, describe, expect, it } from "vitest";
import { envOrThrow } from "../src/obj/envOrThrow.js";

const NAME = "HELPERS_TEST_ENV_VAR";

afterEach(() => {
	delete process.env[NAME];
});

describe("envOrThrow", () => {
	it("returns the value when it is set", () => {
		process.env[NAME] = "hello";
		expect(envOrThrow(NAME)).toBe("hello");
	});

	it("preserves surrounding whitespace in a real value", () => {
		process.env[NAME] = " a b ";
		expect(envOrThrow(NAME)).toBe(" a b ");
	});

	it("throws when the variable is not set", () => {
		expect(() => envOrThrow(NAME)).toThrow(/not set/);
	});

	// `process.env.X = ""` is "set but blank", which slipped past the
	// undefined check and returned an empty string from a function whose whole
	// purpose is to guarantee a usable value.
	describe("variables that are set but blank", () => {
		it("throws for an empty string", () => {
			process.env[NAME] = "";
			expect(() => envOrThrow(NAME)).toThrow(/set but empty/);
		});

		it("throws for whitespace only", () => {
			process.env[NAME] = "   ";
			expect(() => envOrThrow(NAME)).toThrow(/set but empty/);
		});

		it("returns the blank value when allowEmpty is true", () => {
			process.env[NAME] = "";
			expect(envOrThrow(NAME, true)).toBe("");
		});

		it("still throws for an unset variable when allowEmpty is true", () => {
			expect(() => envOrThrow(NAME, true)).toThrow(/not set/);
		});
	});

	it("names the variable in the error", () => {
		expect(() => envOrThrow(NAME)).toThrow(new RegExp(NAME));
	});
});
