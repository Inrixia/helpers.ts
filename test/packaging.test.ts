import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readRepoFile = (file: string): string => readFileSync(path.join(packageRoot, file), "utf8");
const pkg = JSON.parse(readRepoFile("package.json")) as {
	main: string;
	types: string;
	exports: Record<string, unknown>;
	sideEffects?: boolean;
};

describe("package.json exports", () => {
	it("declares a main entry", () => {
		expect(pkg.exports["."]).toEqual({
			types: "./dist/index.d.ts",
			default: "./dist/index.js",
		});
	});

	// There was no exports map at all, so the only entry point was `main`, and
	// adding subpaths later would have been a breaking change.
	it("declares the test matcher subpath", () => {
		expect(pkg.exports["./test"]).toEqual({
			types: "./dist/test.d.ts",
			default: "./dist/test.js",
		});
	});

	it("keeps existing deep imports working", () => {
		expect(pkg.exports["./dist/*"]).toBe("./dist/*");
	});

	it("lets tools read package.json", () => {
		expect(pkg.exports["./package.json"]).toBe("./package.json");
	});

	it("keeps main and types for resolvers that ignore exports", () => {
		expect(pkg.main).toBe("./dist/index.js");
		expect(pkg.types).toBe("./dist/index.d.ts");
	});

	it("is marked side effect free", () => {
		expect(pkg.sideEffects).toBe(false);
	});
});

describe(".npmignore", () => {
	// Source maps point at ../../src/..., but src was excluded from the
	// published tarball, so every map dead-ended for consumers.
	it("publishes src so source maps and declaration maps resolve", () => {
		const npmignore = readRepoFile(".npmignore");
		expect(npmignore).toContain("!src/**/*");
	});

	it("still publishes dist", () => {
		expect(readRepoFile(".npmignore")).toContain("!dist/**/*");
	});
});
